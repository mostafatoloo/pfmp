# Telegram bot setup (Phase 2)

Telegram is **optional**. The web app works fully without it.

## Environment

```bash
TELEGRAM_BOT_TOKEN=...          # from @BotFather — never commit
TELEGRAM_BOT_USERNAME=YourBot   # without @
TELEGRAM_WEBHOOK_SECRET=...     # random string; set as BotFather webhook secret
```

## Linking flow

1. Signed-in user opens **Settings → Telegram → Link**.
2. Server creates a short-lived, single-use token (hashed at rest).
3. User sends `/start <token>` to the bot.
4. Webhook (`POST /api/v1/telegram/webhook`) verifies the token and stores `TelegramLink`.
5. User can unlink anytime.

Never ask users for application passwords in Telegram.

## Commands

| Command | Behavior |
|---------|----------|
| `/start <token>` | Link account |
| `/today` | List open tasks in the user's personal workspace |
| `/done <taskId>` | Complete an authorized task |

Authorization uses the same workspace membership rules as the web app.

## Local development

- Use a tunnel (ngrok, Cloudflare tunnel) to expose `/api/v1/telegram/webhook`, or poll with a small worker (not shipped by default).
- Set webhook: `https://api.telegram.org/bot<token>/setWebhook?url=<https-url>/api/v1/telegram/webhook&secret_token=<TELEGRAM_WEBHOOK_SECRET>`

## Delivery

Notification jobs may enqueue `notification.dispatch` with channel `telegram`. Delivery records use idempotency keys to prevent duplicates. Respect user notification preferences and quiet hours when wiring reminder jobs.
