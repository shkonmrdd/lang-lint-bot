# Lang Lint Bot - Grammar Checker for Telegram
Get instant AI-powered grammar feedback while you practice any language in Telegram. The bot reviews every message you send while chatting, catches slips, and hands back polished alternatives. Under the hood it leans on a configurable LLM so you can tune tone, target language, and feedback depth to match how you want to learn. Authorized chat data can stay in memory for quick sessions or move to PostgreSQL and SQLite via TypeORM when you need persistence.

<p align="center">
  <img src="docs/assets/logo.png" alt="Lang Lint Bot Logo" width="200">
</p>

## Features
- Highlights grammatical mistakes and offers corrected versions of user messages.
- Customizable LLM provider, model, and prompt so you can adapt tone and feedback style.
- Auth flow that keeps unauthorized users out with a shared activation code.
- Storage adapters for in-memory, PostgreSQL, and SQLite. Additional TypeORM providers are a drop-in once you install their drivers.

## Prerequisites
1. [Bun](https://bun.sh) 1.1 or newer (installs dependencies and runs the bot)
2. A Telegram bot token (create via [@BotFather](https://t.me/BotFather))
3. Optional: a database supported by TypeORM (PostgreSQL, MySQL, SQLite, etc.)

## Quickstart
```bash
# install JavaScript dependencies
bun install

# run in watch mode
bun run dev
```

Once the bot prints “Bot is up and running…”, open Telegram and message it.

## Configure Environment
Copy the existing `.env` file or create a new one and provide the variables below. The bot requires both an LLM provider and model name so it knows which backend to call for grammar suggestions.

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `TELERGRAM_API_KEY` | ✅ | – | Telegram Bot API token. |
| `BOT_AUTH_CODE` | ⚠️ | `null` | Shared code users must send to unlock the bot. Leaving it empty allows anyone to use the bot. |
| `TARGET_LANG` | | `English` | Target language for corrections. |
| `NATIVE_LANG` | | `Spanish` | Used for additional context in prompts. |
| `MARK_AS_REPLY` | | `false` | Set to `true` to respond as a threaded reply. |
| `LLM_MODEL` | ✅ | – | Model identifier passed to the LLM SDK (e.g. `gpt-5-mini`). |
| `LLM_PROVIDER` | ✅ | – | Provider key (e.g. `openai`). Also used to derive `<PROVIDER>_API_KEY`. |
| `LLM_BASE_URL` | | `null` | Override the base URL for custom endpoints. |
| `LLM_API_KEY` | | `null` | API key used if provider-specific key or `OPENAI_API_KEY` is missing. |
| `OPENAI_API_KEY` | | `null` | Checked when `LLM_PROVIDER` is omitted; keeps OpenAI as a convenient default. |
| `DATABASE_URL` | | `null` | Connection string for persistent auth storage. |
| `DATABASE_PROVIDER` | | `null` | One of the supported TypeORM providers (see below). Required when `DATABASE_URL` is set. |

### Storage Modes
- **In-memory (default):** no database variables set. Good for quick tests, all data is lost on restart.
- **TypeORM:** set both `DATABASE_URL` and `DATABASE_PROVIDER`. The `pg` and `sqlite3` drivers are already included, so PostgreSQL and SQLite work without extra packages. Failures to initialize persistent storage trigger a log message and automatic fallback to the in-memory adapter.

#### Supported TypeORM Providers

| Provider value | Driver package | Included here? | Notes |
| --- | --- | --- | --- |
| `postgres` | `pg` | ✅ | Works out of the box. |
| `sqlite` | `sqlite3` | ✅ | Works out of the box. |
| `better-sqlite3` | `better-sqlite3` | ➖ | Higher-performance SQLite binding. |
| `cockroachdb` | `pg` | ➖ | Uses the PostgreSQL wire protocol; check [TypeORM's CockroachDB caveats](https://typeorm.io) before relying on it. |
| `mariadb` | `mariadb` | ➖ | |
| `mssql` | `mssql` | ➖ | |
| `mysql` | `mysql2` | ➖ | |

Install any missing driver with `bun add <package>` and follow the [TypeORM driver guides](https://typeorm.io/docs/drivers/sqlite) for provider-specific configuration tips.

#### Example: PostgreSQL `.env`
```env
TELERGRAM_API_KEY=123456789:abc
BOT_AUTH_CODE=letmein
TARGET_LANG=Spanish
NATIVE_LANG=English
LLM_PROVIDER=openai
LLM_MODEL=gpt-5-mini
DATABASE_PROVIDER=postgres
DATABASE_URL=postgresql://lang-lint-bot:secret@localhost:5432/lang_lint_bot
```

#### Example: SQLite `.env`
```env
TELERGRAM_API_KEY=123456789:abc
BOT_AUTH_CODE=letmein
TARGET_LANG=Spanish
NATIVE_LANG=English
LLM_PROVIDER=openai
LLM_MODEL=gpt-5-mini
DATABASE_PROVIDER=sqlite
DATABASE_URL=file:./lang-lint-bot.sqlite
```

## Bot Workflow
1. Send `/activate <BOT_AUTH_CODE>` in a chat to authorize it.
2. Write messages in your target language.
3. The bot replies with grammar feedback and corrected phrasing while following the tone configured via `LLM_PROMPT`.

## Troubleshooting
- Missing or invalid env vars cause the process to exit early. Double-check `.env`.
- If TypeORM fails to connect, ensure the database URL is reachable and the specified provider matches your driver.
