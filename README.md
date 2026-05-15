# WebMCP Article Reader Sample

技術ブログHPで「タイトル・概要だけ表示」し、気になった記事だけ `load_article_for_llm` tool でLLMに渡すサンプルです。

## GitHub Pages公開

このリポジトリは GitHub Actions で `static-demo.html` を GitHub Pages に公開する設定済みです。

push後にGitHub上で一度だけ設定してください。

1. Repository `Settings` を開く
2. `Pages` を開く
3. `Build and deployment` の `Source` を **GitHub Actions** にする
4. `main` ブランチにpush
5. Actionsの `Deploy static demo to GitHub Pages` 完了後、以下で開く

```text
https://koheiyamashita.github.io/webmcp-article-reader-sample/
```

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

## ローカル確認

```bash
cd /workspace/webmcp-article-reader-sample
python3 -m http.server 8080
# http://localhost:8080/static-demo.html を開く
```

## React/Vite版

この環境にはnpmが無かったので未検証ですが、Node.jsがある環境なら:

```bash
npm install
npm run dev
```
