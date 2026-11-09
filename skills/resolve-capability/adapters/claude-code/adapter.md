---
kind: harness
owns: [Claude, CLAUDE.md, .claude/, CLAUDE_CONFIG_DIR, AskUserQuestion, TodoWrite, ListAgents, SendMessage, CronCreate, ScheduleWakeup, TaskStop, subagent_type, run_in_background, notify_when_idle, skill-creator]
---

# Claude Code

## Detect

Your tool list has the `Agent` tool, and your instructions say you are Claude Code.

## Capabilities

### `spawn-subagent`

The `Agent` tool. Its schema has `model`, `effort`, `subagent_type`, `isolation` (`"worktree"` gives the subagent its own checkout, unverified), and `run_in_background`. Read the accepted model and effort values from the schema you have now, because they change with the version. Read the subagent types and their tools from the same place. A read-only job takes a type whose tool list has no edit or write tool (`Explore` and `Plan` at the time of writing, so check the list you have). The general-purpose types have every tool, so a brief that says not to edit does not make them read-only. Some read-only types drop tools that others keep, MCP tools among them.

- Seen on 2026-10-27 in Claude Code 2.1.311: `Explore` and `Plan` drop the edit, write, and agent tools but keep the MCP tools and `Bash`, so they can still write through the shell. Say not to edit in the brief and check `git status` after. `claude-code-guide` has only `Bash`, `Read`, `WebFetch`, and `WebSearch`, with no MCP tools.
- Seen on 2026-10-27: `model` takes only the aliases in the schema (`opus`, `sonnet`, `haiku`, `fable`), and `subagent_type: "fork"` ignores `model`.
- A subagent started with `Agent` takes only Claude models. Another vendor's model needs `spawn-worker`, which a shell can do (see `../../references/cli-workers.md`).

### `isolate-checkout`

`Agent` with `isolation: "worktree"` (unverified), `claude --worktree [name]`, or Worktree mode in the desktop app's Code tab.

### `control-agent`

`ListAgents` lists the Claude Code sessions on this machine, terminal ones included, with their names and whether each is idle or busy, and `SendMessage` delivers a message to one by name (seen: a message reached a terminal session that another program had started, and it answered). `notify_when_idle` asks for one notice when the target next goes idle. A session in another permission mode holds a cross-session message for its user's approval, so silence is not agreement. For background sessions, `claude agents --json`, `claude logs <id>`, and `claude stop <id>`.

### `wake-on-event`

A command started with `run_in_background` wakes the session when it ends. `SendMessage` with `notify_when_idle: true` sends one notice when another local Claude session next goes idle (seen). `/loop`, `CronCreate`, `ScheduleWakeup`, `Monitor`, `SendMessage`, and `TaskStop` exist in some versions. They are unverified here, so look at your tool list.

### `run-on-schedule`

`/loop`, `CronCreate`, `ScheduleWakeup` (unverified).

### `ask-user`

`AskUserQuestion`.

### `track-todos`

Use the plan or todo tool if your tool list has one. Otherwise keep the list in the reply.

### `author-skill`

`skill-creator`.

### `find-sessions`

`<config dir>/projects/<workspace folder>/<session>.jsonl`. The config dir is `$CLAUDE_CONFIG_DIR` when it is set, otherwise `~/.claude`. The workspace folder is the absolute path with `/` and `.` replaced by `-`. Tool calls are `tool_use` blocks in `assistant` messages. To pick your own session out of the files, read the first `user` record's `message.content`. Live sessions: `ListAgents` and `claude agents --json`.

### `locate`

Instructions: `CLAUDE.md`. Project skills: `.claude/skills/`. User skills: `~/.claude/skills/`.

### `list-mcp-servers`

Your tool list, or `claude mcp list`.

## Start me from outside

- `claude -p --model <model> --effort <level> --output-format json "<brief>"`. Ran with `haiku`. The answer is in the JSON `result` and the model that ran is a key of `modelUsage`. `--effort` was not run. Read-only: `--permission-mode plan` or an `--allowedTools` list (not tested).
- In the background: `claude --bg --model <model> "<brief>"` prints a short id. `claude agents --json --all` lists sessions (interactive and background), and `claude logs <id>`, `claude attach <id>`, `claude stop <id>`, `claude rm <id>` manage a background one. Ran end to end. The workspace must already be trusted, so run it where a Claude Code session has been accepted before. `rm` deletes the session. A session started with `claude --bg` outlives the session that started it.
- `claude -p` does not hang on an open stdin. It waits 3 seconds, prints "no stdin data received", and goes on, so `< /dev/null` is harmless but not needed.
- Session record: `~/.claude/projects/<cwd with each / as ->/`, as `find-sessions` says.

## Surfaces

- The desktop app's Code tab runs sessions of its own (Worktree mode there is off until you turn it on). Its documentation says Claude sees only the sessions the desktop app runs. This was not run here.

## For users

- `/name` runs a skill.

## Limits

- No command or file read here reports remaining usage. `/usage` exists only in an interactive session. A limit shows up as an error when a start fails.
- In the default permission mode, a first read outside the project can ask the user for permission.
