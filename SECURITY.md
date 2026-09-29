# セキュリティ / Security

## 日本語

脆弱性や、誤って公開された秘密情報・個人情報・運用データを見つけた場合は、公開Issueへ詳細を書かず、GitHubのSecurity Advisoryから非公開で報告してください。

実運用では管理画面/APIに認証・認可、レート制限、監査ログを追加し、`OPENAI_API_KEY`とD1設定を秘密情報として管理してください。このポートフォリオ版は実運用データを同梱しません。

## English

If you discover a vulnerability or accidentally exposed secret, personal data, or operational data, please report it privately through a GitHub Security Advisory rather than posting details in a public issue.

For production use, add authentication and authorization, rate limiting, and audit logs to the administration UI and API. Manage `OPENAI_API_KEY` and D1 configuration as secrets. This portfolio edition ships without production data.
