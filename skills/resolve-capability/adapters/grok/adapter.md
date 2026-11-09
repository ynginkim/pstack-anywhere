---
kind: harness
owns: [Grok, .grok/, spawn_subagent, AGENTS.md]
---

# Grok

## Detect

Your instructions say you are Grok.

## Capabilities

### `spawn-subagent`

`spawn_subagent` (unverified, Grok has not run as a parent here). Read its schema.

### `isolate-checkout`

`grok -w [name]` (unverified).

### `find-sessions`

`~/.grok/sessions/<URL-encoded cwd>/<session>/chat_history.jsonl`. `summary.json` in the same folder has `current_model_id` and `reasoning_effort`. Read the model and the effort that ran from there and say them in your reply. For `worktree-audit.sh`: `--store "$HOME/.grok/sessions"`.

### `locate`

Instructions: `AGENTS.md`. Skills: `~/.grok/skills/`, where the `skills` CLI links each skill as `<name> -> ../../.agents/skills/<name>`.

### `list-mcp-servers`

Your tool list, or `grok mcp list`.

## Start me from outside

- `grok -p "<brief>" -m <model> --reasoning-effort <level> --permission-mode plan --output-format json`. Ran with `grok-4.7-build-fast` at `low`, and `modelUsage` named that model. Started this way, Grok takes the model and the effort. It refuses `--add-dir` ("additionalDirectories is not supported: a session works only in its cwd"), so start it in the folder it should read. `-w [name]` starts it in its own git worktree (not tested).
- `grok -p` does not hang on an open stdin, so `< /dev/null` is harmless but not needed.
- Session record: `~/.grok/sessions/<cwd, URL-encoded>/`, as `find-sessions` says.

## For users

- `/name` runs a skill (seen when Grok took `/poteto-mode` as a slash command).
- The `skills` CLI id is `grok`. Grok lists skills through links in `~/.grok/skills/`.
- It may load any skill from its description.

## Limits

- Grok running on its own, outside an environment, has not been run for this fork as the session you run in.
