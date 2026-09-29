# Spot Research Desk

## 日本語

このディレクトリには、候補地点の調査、根拠確認、承認、JSON出力を行う管理画面が含まれます。Next.js互換のVinext、Cloudflare Workers、D1を使用します。

### ローカル実行

```bash
npm install
npm run dev
```

Web調査ジョブを実行する場合だけ、ローカルの`.env`へ`OPENAI_API_KEY`を設定してください。秘密情報をGitへ追加しないでください。

### 検証

```bash
npm run lint
npm test
```

## English

This directory contains the administration UI for researching candidate places, reviewing evidence, approving records, and exporting JSON. It uses the Next.js-compatible Vinext runtime, Cloudflare Workers, and D1.

### Run locally

```bash
npm install
npm run dev
```

Set `OPENAI_API_KEY` in a local `.env` file only when running web-research jobs. Never commit secrets to Git.

### Verification

```bash
npm run lint
npm test
```
