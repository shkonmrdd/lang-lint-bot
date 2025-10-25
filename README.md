# Lang Lint Bot - Grammar Checker for Telegram
Get instant AI-powered grammar feedback while you practice any language in Telegram. The bot reviews every message you send while chatting, catches slips, and hands back polished alternatives. Under the hood it leans on a configurable LLM so you can tune tone, target language, and feedback depth to match how you want to learn. Authorized chat data can stay in memory for quick sessions or move to PostgreSQL and SQLite via TypeORM when you need persistence.

<p align="center">
  <img src="docs/assets/logo.png" alt="Lang Lint Bot Logo" width="200">
</p>

## Features
- Highlights grammatical mistakes and offers corrected versions of user messages.
- Customizable LLM provider, model, and prompt so you can adapt tone and feedback style.
- Auth flow that keeps unauthorized users out with a shared activation code.
- Storage adapters for in-memory, PostgreSQL, and SQLite.

## Prerequisites
1. [Bun](https://bun.sh) 1.1 or newer
2. A Telegram bot token (create via [@BotFather](https://t.me/BotFather))
3. Optional: PostgreSQL or SQLite for persistent storage.

## Quickstart
```bash
# install JavaScript dependencies
bun install

# run in watch mode
bun run dev
```

Once the bot prints “Bot is up and running…”, open Telegram and message it.

## Run with Docker
```bash
# build the image (run from repository root)
docker build -t lang-lint-bot .

# start the bot (loads config from .env)
docker run --rm --env-file .env lang-lint-bot
```

Need persistent storage? Check the storage table below for the right `DATABASE_*` values before you boot the container. Connecting to a database on the host machine? Use `host.docker.internal` instead of `localhost`.

Example `.env` (SQLite):
```env
TELEGRAM_API_KEY=123456789:ABC
BOT_AUTH_CODE=letmein
LLM_PROVIDER=openai
LLM_API_KEY=sk-example
LLM_MODEL=gpt-4.1-mini
DATABASE_PROVIDER=sqlite
DATABASE_URL=file:./sqlite/lang_lint_bot.sqlite
```

Example `.env` (PostgreSQL):
```env
TELEGRAM_API_KEY=123456789:ABC
BOT_AUTH_CODE=letmein
LLM_PROVIDER=openai
LLM_API_KEY=sk-example
LLM_MODEL=gpt-4.1-mini
DATABASE_PROVIDER=postgres
DATABASE_URL=postgresql://langlint:secret@db.example.com:5432/lang_lint_bot
```

## Configure Environment
Copy the existing `.env` file or create a new one and provide the variables below. The bot requires both an LLM provider and model name so it knows which backend to call for grammar suggestions.

| Variable | Required? | Default | Notes |
| --- | --- | --- | --- |
| `TELEGRAM_API_KEY` | Yes | – | Telegram Bot API token. |
| `BOT_AUTH_CODE` | Yes | `null` | Shared code users must send to unlock the bot. Leaving it empty allows anyone to use the bot. |
| `LLM_MODEL` | Yes | – | Model identifier passed to the LLM SDK (e.g. `gpt-5-mini`). |
| `LLM_PROVIDER` | Yes | – | Provider key (currently only `openai`). |
| `TARGET_LANG` | - | `English` | Target language for corrections. |
| `NATIVE_LANG` | - | `Spanish` | Used for additional context in prompts. |
| `MARK_AS_REPLY` | - | `false` | Set to `true` to respond as a threaded reply. |
| `LLM_BASE_URL` | - | `null` | Override the base URL for OpenAI-compatible endpoints while keeping `LLM_PROVIDER=openai`. |
| `LLM_API_KEY` | Yes | – | Universal API key for the configured LLM provider. |
| `DATABASE_URL` | - | `null` | Connection string for persistent auth storage. |
| `DATABASE_PROVIDER` | - | `null` | Use `postgres` or `sqlite`. Required when `DATABASE_URL` is set. |

### OpenAI-Compatible Endpoints
This bot currently targets OpenAI's API surface area. To use an OpenAI-compatible service (such as a proxy or self-hosted gateway), keep `LLM_PROVIDER=openai` and supply the gateway URL with `LLM_BASE_URL`. Requests will still be signed with `LLM_API_KEY`, so ensure the value matches the key expected by your compatible service.

### Storage Options
| Mode | `DATABASE_PROVIDER` value | `DATABASE_URL` example | Notes |
| --- | --- | --- | --- |
| In-memory (default) | leave unset | leave unset | No persistence; auth data resets whenever the process restarts. |
| PostgreSQL | `postgres` | `postgresql://user:pass@host:5432/lang_lint_bot` | Requires a running PostgreSQL instance. |
| SQLite | `sqlite` | `file:./sqlite/lang_lint_bot.sqlite` | Stores data in a local SQLite file relative to the project root. |

PostgreSQL and SQLite drivers ship with the project, so no extra packages are required. If persistent storage fails to initialize, the bot logs the error and falls back to the in-memory adapter.

## Bot Workflow
1. Send `/activate <BOT_AUTH_CODE>` in a chat to authorize it.
2. Write messages in your target language.
3. The bot replies with grammar feedback and corrected phrasing while following the tone configured via `LLM_PROMPT`.

## Troubleshooting
- Missing or invalid env vars cause the process to exit early. Double-check `.env`.
- If `LLM_API_KEY` is blank, the startup validation fails immediately; ensure your OpenAI (or compatible) key is present.
- If TypeORM fails to connect, ensure the database URL is reachable and the specified provider matches your driver.
