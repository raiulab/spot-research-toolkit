# Spot Research Toolkit

## 日本語

地域の店舗・イベント候補を、出典と確認状態を保ったまま調査・審査・出力するためのポートフォリオ実装です。AIによる候補収集をそのまま公開せず、`draft`から人手確認を経て`verified`へ進めるワークフローを中心に設計しています。

### 主な機能

- Web検索付きOpenAI Responses APIによる候補調査
- 一次情報、フィールドごとの根拠、未解決事項の記録
- D1上での候補・調査ジョブ・定期実行の管理
- 承認済みレコードだけを標準JSONまたは軽量JSONで出力
- 実在情報を含まない架空のJSON例とJSON Schema

### 起動

Node.js 22.13以降が必要です。

```bash
cd admin
npm install
npm run dev
```

Web調査を実行する場合のみ、Git管理外の`.env`へ`OPENAI_API_KEY`を設定します。キーがない場合も、ジョブは「API設定待ち」として安全に保存されます。

### 検証

```bash
cd admin
npm run lint
npm test
```

### 公開版のデータ方針

このリポジトリには、実在店舗の調査結果、住所一覧、口コミ要約、運用履歴、デプロイ設定、APIキーは含めていません。`examples/`は`example.invalid`を使った架空データだけです。実運用データは別の非公開ストレージで管理してください。

この公開版はポートフォリオ用途です。そのままインターネットへ公開せず、認証・認可、レート制限、監査ログを追加してから運用してください。

## English

This portfolio implementation researches, reviews, and exports local place and event candidates while preserving sources and verification status. Instead of publishing AI-collected candidates directly, its core workflow moves records from `draft` to `verified` through human review.

### Key features

- Candidate research through the OpenAI Responses API with web search
- Primary-source, field-level evidence, and unresolved-issue tracking
- D1-backed management of candidates, research jobs, and schedules
- Canonical or compact JSON export limited to approved records
- Fictional JSON examples and a JSON Schema with no real-world records

### Run locally

Node.js 22.13 or later is required.

```bash
cd admin
npm install
npm run dev
```

Only when running web research, set `OPENAI_API_KEY` in a Git-ignored local `.env`. Without a key, the job is safely stored as waiting for API configuration.

### Verification

```bash
cd admin
npm run lint
npm test
```

### Public-repository data policy

This repository contains no researched real businesses, address lists, review summaries, operating history, deployment configuration, or API keys. Files under `examples/` are fictional and use `example.invalid`. Keep production data in separate private storage.

This public edition is intended as a portfolio project. Do not expose it directly to the internet; add authentication and authorization, rate limiting, and audit logging before production use.

## License

MIT. See [LICENSE](LICENSE).
