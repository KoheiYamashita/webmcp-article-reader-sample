import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

type Article = {
  id: string;
  title: string;
  summary: string;
  url: string;
  tags: string[];
  markdown: string;
};

type WebMCPTool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: Record<string, unknown>, agent?: { requestUserInteraction?: (fn: () => unknown) => unknown }) => unknown | Promise<unknown>;
};

declare global {
  interface Navigator {
    modelContext?: {
      registerTool: (tool: WebMCPTool, options?: { signal?: AbortSignal }) => void;
    };
  }
}

const articles: Article[] = [
  {
    id: 'edge-sqlite',
    title: 'Edge環境でSQLiteを使う設計パターン',
    summary: 'D1、Turso、Litestreamを題材に、エッジ近傍DBの使い分けを整理します。',
    url: 'https://example.com/edge-sqlite',
    tags: ['sqlite', 'edge', 'database'],
    markdown: `# Edge環境でSQLiteを使う設計パターン

この記事では、Edge環境でSQLiteを扱う代表的な選択肢を比較します。

## 要点

- 読み取り中心ならレプリカ配布が強い
- 書き込みが多いなら整合性モデルを先に決める
- Cloudflare D1、Turso、Litestreamは思想が異なる

## まとめ

小規模サービスではSQLiteの単純さを保ちつつ、配布やバックアップの仕組みだけ足すのが現実的です。`
  },
  {
    id: 'webmcp-reader',
    title: 'WebMCPで記事をLLMと読むUIを作る',
    summary: 'Webページ側が記事本文をtoolとして公開し、ユーザーのLLMが必要な時だけ読む設計です。',
    url: 'https://example.com/webmcp-reader',
    tags: ['webmcp', 'llm', 'browser'],
    markdown: `# WebMCPで記事をLLMと読むUIを作る

WebMCPでは、Webページ自体がブラウザ内でLLM向けのtoolを公開できます。

## 体験

1. ユーザーは記事一覧を見る
2. 気になった記事の「LLMと読む」を押す
3. LLMクライアントがページのtoolを呼び、記事本文を取得する
4. ユーザーは会話しながら読み進める

## 利点

本文を最初からLLMに渡さず、必要な記事だけ構造化して渡せます。`
  }
];

const registeredTools: WebMCPTool[] = [];

function toolResultText(obj: unknown) {
  return { content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] };
}

const listArticlesTool: WebMCPTool = {
  name: 'list_articles',
  description: 'Return article list with title, summary, url and tags only. Does not return full article body.',
  inputSchema: { type: 'object', properties: {} },
  execute() {
    return toolResultText({ articles: articles.map(({ id, title, summary, url, tags }) => ({ id, title, summary, url, tags })) });
  }
};

const loadArticleTool: WebMCPTool = {
  name: 'load_article_for_llm',
  description: 'Load one selected article as Markdown so the user can read it conversationally with an LLM.',
  inputSchema: {
    type: 'object',
    properties: { articleId: { type: 'string', description: 'The article id to load. Use list_articles first if unknown.' } },
    required: ['articleId']
  },
  execute({ articleId }) {
    const article = articles.find((a) => a.id === articleId);
    if (!article) throw new Error(`Article not found: ${articleId}`);
    return toolResultText({
      title: article.title,
      url: article.url,
      tags: article.tags,
      contentType: 'text/markdown',
      markdown: article.markdown,
      suggestedPrompt: `この記事「${article.title}」を日本語で一緒に読み進めて。まず要点を短く説明して、その後に質問を受けて。`
    });
  }
};

function registerWebMCPTool(tool: WebMCPTool) {
  registeredTools.push(tool);
  if (navigator.modelContext?.registerTool) {
    navigator.modelContext.registerTool(tool);
    return true;
  }
  return false;
}

const hasRealWebMCP = [listArticlesTool, loadArticleTool].map(registerWebMCPTool).some(Boolean);

async function runToolLocallyForDemo(toolName: string, input: Record<string, unknown>) {
  const tool = registeredTools.find((t) => t.name === toolName);
  if (!tool) throw new Error(`Tool not found: ${toolName}`);
  return tool.execute(input, { requestUserInteraction: async (fn) => fn() });
}

function App() {
  const [selected, setSelected] = useState<string>('');
  const [toolOutput, setToolOutput] = useState('');
  const tools = useMemo(() => registeredTools.map((t) => t.name), []);

  async function readWithLLM(articleId: string) {
    setSelected(articleId);
    const result = await runToolLocallyForDemo('load_article_for_llm', { articleId });
    setToolOutput((result as { content: { text: string }[] }).content[0].text);
  }

  return (
    <main>
      <header>
        <p className="eyebrow">WebMCP demo</p>
        <h1>技術ブログを「LLMと読む」サンプル</h1>
        <p>一覧ではタイトルと概要だけ表示。記事本文はWebMCP toolとして登録します。</p>
      </header>

      <section className="tools">
        {hasRealWebMCP
          ? 'このブラウザは navigator.modelContext に対応しています。toolsを実際にWebMCP登録しました。'
          : 'このブラウザはまだ navigator.modelContext に未対応です。ただしコードはWebMCP proposalの registerTool 形式で実装済みです。'}
      </section>

      <section className="tools"><strong>登録したWebMCP tools:</strong> {tools.join(', ')}</section>

      <section className="grid">
        {articles.map((article) => (
          <article className="card" key={article.id}>
            <div className="tags">{article.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            <h2>{article.title}</h2>
            <p>{article.summary}</p>
            <button onClick={() => readWithLLM(article.id)}>LLMと読む</button>
          </article>
        ))}
      </section>

      <section className="output">
        <h2>デモ用: tool実行結果</h2>
        <p>{selected ? `selected article: ${selected}` : 'まだ未選択'}</p>
        <pre>{toolOutput || 'WebMCP対応ブラウザ/エージェントなら navigator.modelContext のtoolとして見える想定です。この画面ではボタンで同じexecuteを実行します。'}</pre>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
