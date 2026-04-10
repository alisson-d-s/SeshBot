# SeshBot — Wordle Ranking Discord Bot

A minimal Discord bot that tracks daily Wordle results from server messages and generates rankings.

## Setup

1. **Clone the repository**

   ```bash
   git clone <repo-url>
   cd SeshBot
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy the example file and fill in your values:

   ```bash
   cp .env.example .env
   ```

   | Variable | Description |
   |---|---|
   | `DISCORD_TOKEN` | Your Discord bot token |
   | `WORDLE_CHANNEL_ID` | The channel ID where Wordle results are posted |

4. **Start the bot**

   ```bash
   npm start
   ```

## How It Works

The bot listens for messages matching the standard Wordle result format:

```
Wordle 1755 4/6

⬛⬛🟨⬛⬛
🟨🟩⬛⬛⬛
🟩🟩🟩⬛⬛
🟩🟩🟩🟩🟩
```

It extracts the game number and attempt count, then stores the result in `data/results.json`. Duplicate submissions (same user + same game) are silently ignored.

## Commands

| Command | Description |
|---|---|
| `!ranking <number>` | Show the ranking for a specific Wordle game (e.g., `!ranking 1755`) |
| `!ranking today` | Show the ranking for today's Wordle game |

### Ranking Rules

1. Fewer attempts = better rank
2. `X` (failure) is always ranked last
3. Ties are broken by submission time (earlier wins)

## Running Tests

```bash
npm test
```

Uses Node's built-in test runner — no extra dependencies needed.
