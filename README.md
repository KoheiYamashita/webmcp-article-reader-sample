# WebMCP Article Reader Sample

技術ブログHPで「タイトル・概要だけ表示」し、気になった記事だけ `load_article_for_llm` tool でLLMに渡すサンプルです。

## GitHub Pages公開

Actionsのrunner待ちで詰まる場合があるため、`docs/index.html` から直接公開できる構成にしています。

push後にGitHub上で一度だけ設定してください。

1. Repository `Settings` を開く
2. `Pages` を開く
3. `Build and deployment` の `Source` を **Deploy from a branch** にする
4. `Branch` を `main`、folderを `/docs` にする
5. Save
6. 数分後、以下で開く

```text
https://koheiyamashita.github.io/webmcp-article-reader-sample/
```

補足: `.github/workflows/pages.yml` も残していますが、Actionsがqueuedで止まる場合は上記の `/docs` 公開の方を使ってください。

## 実装内容

実WebMCP proposalの形で、以下を使ってtool登録しています。

```js
window.navigator.modelContext.registerTool({
  name,
  description,
  inputSchema,
  execute
})
```

実装しているtools:

- `list_articles`
  - 記事一覧をタイトル・概要・URL・タグだけ返す
- `load_article_for_llm`
  - 指定記事のMarkdown本文、URL、タグ、推奨プロンプトを返す

## 注意

通常のブラウザではまだ `navigator.modelContext` が未実装の場合があります。
その場合はWebMCP登録はされませんが、画面上の「LLMと読む」ボタンで同じ `execute` をローカル実行して挙動確認できます。

## Cloudflare Pages公開

Cloudflare Pagesでは以下で設定してください。

```text
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Node.js version: 22
```

`wrangler.toml` も追加済みです。

```toml
pages_build_output_dir = "dist"
```

## ローカル確認

Node.jsがある環境なら:

```bash
cd /workspace/webmcp-article-reader-sample
npm install
npm run build
npm run dev
```

依存なしHTML版だけ見る場合:

```bash
python3 -m http.server 8080
# http://localhost:8080/static-demo.html を開く
```
