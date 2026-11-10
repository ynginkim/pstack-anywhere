---
kind: harness
owns: [Codex, CODEX_HOME, .codex, spawn_agent, update_plan, AGENTS.md, skill-creator]
---

# Codex

## Detect

Your instructions say you are Codex, and your tool list has a shell tool.

## Capabilities

### `spawn-subagent`

`spawn_agent` (unverified). Read its schema for the models and efforts it accepts. `spawn_agent` takes only Codex models. Another vendor's model needs `spawn-worker`, which a shell can do (see `../../references/cli-workers.md`). Codex running its own subagents has not been run for this fork.

### `isolate-checkout`

`codex --worktree` (documented, unverified).

### `control-agent`

`codex agents` browses the sessions on the shared local app-server daemon, `codex queue --thread <id> --message <text>` queues a message for an existing session, and `codex resume`, `fork`, `archive` work on saved ones (help text read, not run).

### `run-on-schedule`

The desktop app has scheduled tasks (documented, unverified). The Codex CLI has none.

### `track-todos`

`update_plan` was not in the instructions of the Codex build seen here (0.160.1), and the Codex app showed no plan list. Keep the list in the reply.

### `author-skill`

`$skill-creator`.

### `find-sessions`

`$CODEX_HOME/sessions/YYYY/MM/DD/rollout-*.jsonl`, filtered on `payload.cwd`. `CODEX_HOME` is `~/.codex` unless something set it. Tool calls are `function_call` and `custom_tool_call` items. `history.jsonl` in `CODEX_HOME` is not a rollout. To pick your own session out of the files, read the first user message after `session_meta`. Live sessions: `codex agents`. For `worktree-audit.sh`: `--store "${CODEX_HOME:-$HOME/.codex}/sessions"`.

### `locate`

Instructions: `AGENTS.md`. Codex reads `~/.agents/skills/` and the project's `.agents/skills/` directly, so a skill there needs no link. Models: `models_cache.json` in `CODEX_HOME`.

### `list-mcp-servers`

Your tool list, or `codex mcp list`. Seen on 2026-10-27 with Codex 0.160.1: Codex does not read another product's MCP configuration. It uses its own servers and the ChatGPT app's connectors, whose tools appear only after a tool search. Some of those tools write to outside services, and whether `-s read-only` blocks them was not checked, so a worker's brief forbids outside writes.

## Start me from outside

- `codex exec --skip-git-repo-check --ephemeral -s read-only -C <dir> -m <model> -c model_reasoning_effort=<level> -o <report file> "<brief>" < /dev/null`. `codex exec` runs one brief and exits. `-o <file>` writes the last message, `-s` sets the sandbox, `-m` the model, and `-c model_reasoning_effort=<level>` the effort. Ran headless from another harness's shell with `gpt-6-luna` at `low` and wrote `OK` to the report file. `-s read-only` was accepted. That it blocks edits was not tested. A seat that writes takes `-s workspace-write`. `--dangerously-bypass-approvals-and-sandbox` only when the user asked.
- Close stdin on `codex exec`: end the command with `< /dev/null`. When stdin is not a terminal, `codex exec` prints `Reading additional input from stdin...` and waits for it to reach EOF. A background shell can leave stdin open, and then Codex does nothing: one run sat 66 minutes with a 39-byte log, and the same command with `< /dev/null` finished in 20 seconds. Reproduced with Codex 0.160.1: an open pipe on stdin ran until `timeout` killed it (exit 124) and wrote no report, while `< /dev/null` and a closed descriptor (`<&-`) both finished in about 5 seconds. A log whose only line is that message means this, not a slow model.
- Session record: the rollouts under `find-sessions`.

## Surfaces

- `codex app` continues in the ChatGPT desktop app. The desktop app also has scheduled tasks and worktrees (documented, not run).

## For users

- `$name` runs a skill.
- The `skills` CLI id is `codex`. Codex reads `~/.agents/skills/` directly.
- It may load any skill from its description.
- Skills documentation: https://developers.openai.com/codex/skills
- `$skill-creator` writes skills, `/plan` plans before edits, and the Codex app has scheduled tasks.

## Survey

- **Installed.** `codex` on `PATH`.
- **Models and efforts.** `models_cache.json` in `CODEX_HOME` (`~/.codex/models_cache.json` unless something set it) lists them: `models[].slug`, `display_name`, `supported_reasoning_levels`, and `default_reasoning_level`. `visibility` marks a model that is hidden from the picker. Running in Codex, read `spawn_agent`'s schema for the models and efforts it accepts. If you cannot tell, ask the user to paste the model names.
- **Skill folder.** No link is needed. The `skills` CLI installs a skill for Codex into `~/.agents/skills/` itself, with nothing in `~/.codex/skills/`, so Codex reads `~/.agents/skills/` directly.
- **Model pin.** `config.toml` in `CODEX_HOME`, and the project's `.codex/config.toml`. Seen on 2026-11-09: top-level `model` and `model_reasoning_effort`.
- **Suited to.** pstack names no kind of work for Codex. Offer its models with no default.
- **Not yet checked.** A Codex session with no environment, and Codex starting its own models with `spawn_agent`, were not run. Say `not verified here` for them.

## Limits

- Each rollout under `find-sessions` carries a `rate_limits` record: `primary.used_percent`, `primary.window_minutes`, `primary.resets_at`, and `credits`. It is the value at the end of a turn in an earlier session, so it can be hours or days old. Use it as a hint, never as the reason to pick a model. A limit shows up as an error when a start fails, so handle it then.
- Codex may ignore `disable-model-invocation`, so a slash-only skill can trigger on its own (unverified).
- Codex running on its own, outside an environment, has not been run for this fork as the session you run in.
