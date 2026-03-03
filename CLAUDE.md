# OpenClaw Bridge — Instructions for Claude Code

You have access to MCP tools from the `openclaw-bridge` server for communicating with the user when running in headless/non-interactive mode (`claude -p`).

## When to use

Always use these tools instead of `AskUserQuestion` when running headless. `AskUserQuestion` does not work in `-p` mode — these tools do.

## Tools

### ask_user

Ask the user 1-4 questions. Supports rich options with descriptions.

```
ask_user(
  questions: [
    {
      question: "Which database should I use?",
      header: "Database",
      options: [
        { label: "PostgreSQL", description: "Reliable, great ecosystem" },
        { label: "SQLite", description: "Simple, embedded, no server" }
      ]
    }
  ],
  context: "setting up the backend"
)
```

**Rules:**
- Batch related questions into one call (max 4) — fewer interruptions
- Always include `header` (short tag, max 12 chars)
- Add `description` to options — helps user decide without context-switching
- Include `context` — user may have multiple CC agents running
- If no fixed options, omit `options` for free-text answer
- Set `multiSelect: true` when multiple choices are valid

### notify_user

Send a progress update without waiting for a reply.

```
notify_user(
  message: "All tests passing, creating PR...",
  context: "fixing auth bug"
)
```

**When to notify:**
- Starting a major phase (tests, build, deploy)
- Hitting an unexpected blocker
- Completing the task

## Important

- The user may respond with vague answers like "whatever" or "you pick" — the OpenClaw agent will interpret and choose for them
- Questions are delivered to the user's messaging app (Telegram, Signal, etc.) — keep them concise and self-contained
- Don't ask unnecessary questions — if you can make a reasonable default choice, do so
- A summary of your session is automatically sent when you finish
