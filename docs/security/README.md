# Security

- Server-side workspace authorization on every domain op
- No secrets in git (`.env.example` only)
- Logs redact password/secret/token/API keys / `DATABASE_URL`
- Cross-user isolation proven by SQL Server integration tests
