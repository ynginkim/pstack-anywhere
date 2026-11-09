---
kind: environment
owns: [Orca, ORCA_]
---

# Orca

Facts checked on Orca 1.4.237. Orca adds supervised workers, durable run state, schedules, remote environments, and session search.

## Detect

`env | grep '^ORCA_CLI_'` prints anything. `detect.sh` runs this check. An Orca terminal sets only `ORCA_CLI_BIN_DIR` and an Orca chat sets both. Run Orca commands with `$ORCA_CLI_COMMAND` when it is set, otherwise with `orca`. Below, `orca` means that executable.

## Capabilities

### `isolate-checkout`

Overrides. For a seat that runs as an Orca worker: `worker-start --worktree new-child`. Remove an Orca-managed worktree with the exact step below, never with `git worktree remove`. For any other seat, your harness's mechanism.

### `run-remote`

Overrides. `worker-start --on <saved environment>`. List the environments with `orca environment list`.

### `coordinate-workers`

Overrides. `orca orchestration run-create`, `task-create`, `gate-create`, `check --wait` (see [`references/workers.md`](references/workers.md)). Verdicts stay in the program's tracker file in `durable-store`, as the contract says.

### `control-agent`

Overrides. For an Orca worker: `orca orchestration worker-show`, `send`, `worker-stop`, `worker-abandon`, with the conditions in [`references/workers.md`](references/workers.md). For any other agent, your harness's mechanism.

### `wake-on-event`

Overrides. For Orca workers: `orca orchestration check --wait --types worker_done,escalation,question --timeout-ms <n>`. How long one wait may block depends on the harness, as Launching harnesses says. For a process that ends: `orca terminal wait --terminal <handle> --for exit --timeout-ms <n>`, or `--for tui-idle` for an agent screen. Always pass a timeout. Start the watcher with `orca terminal create --title <name> --command "<command>"`. An idle Orca chat is woken by an orchestration message.

### `run-on-schedule`

Overrides. `orca automations create --name <program> --trigger "<cron or hourly>" --workspace active --reuse-session --provider <agent> --prompt "<tick prompt>"`. Remove it with `orca automations remove` when the program ends. Each tick starts a new agent with no memory, so the prompt carries everything. Orca triggers on a schedule only. For an event trigger, poll with `--precheck <command>` that exits 0 only when new input exists, and hand the input to the run in a state file.

### `ask-user`

Overrides. For a session that runs as an Orca worker: `orca orchestration ask`. A worker never opens a question screen the coordinator cannot answer. For any other session, your harness's mechanism.

### `use-forge`

Adds to. After `gh pr create`, `orca reference add <pr-url> --worktree active` links the PR (see the exact step below).

### `find-sessions`

Adds to. `orca search`, `orca worktree ps`, and `orca orchestration worker-read`. A harness that Orca started under one of its accounts keeps its sessions in that account's home, not in its own store. Launching harnesses names that home per agent. Read it in place of the harness's own store, and pass it to `worktree-audit.sh` as an extra `--store` in the harness's form, with that home in place of the harness's default.

### `locate`

Adds to. Worktrees under Orca: `orca worktree list --json`.

### `drive-app`

Overrides. Orca's browser: `orca goto`, `snapshot`, `click`, `fill`, `screenshot`, `eval`. Native windows: `orca computer`. Run `orca skills get orca-cli` first. Orca has no screen recorder, so for a recording take `orca screenshot` sequences, or use Playwright's video option (unverified), or the macOS recorder the index's fallback names.

## Launching harnesses

Start a worker with the loop in [`references/workers.md`](references/workers.md). Read it before the first worker and when you plan one. A worker starts as `worker-start --agent <Orca agent id>`. Orca's catalog says which agents, models, and efforts it accepts. An id is valid when `$ORCA_USER_DATA_PATH/agent-model-catalog.json` lists it:

```bash
jq -r '.entries[] | .agent as $a | (.live // .discovered).models[]? | "\($a) \(.id) \([.efforts[]?.value] | join(","))"' \
  "$ORCA_USER_DATA_PATH/agent-model-catalog.json" | sort -u
```

`worker-start` rejects an id it does not accept with `failedStage`. Use another id that `select-model` lists for the same agent and say so. Never guess an id. `auto` and `inherit-parent` mean: omit `--model` and `--effort`.

Which agents take model and effort flags:

| Agent | `--model` | `--effort` |
| --- | --- | --- |
| claude, codex, cursor, antigravity, muse | yes | yes, and it needs `--model` |
| omp | yes | no |
| opencode | yes, and only in an existing worktree | no |
| grok | refused | refused |
| zcode and any other | no | no |

The pstack adapter `claude-code` is Orca's agent `claude`. `codex` and `grok` keep their ids. What each one does under Orca:

- **claude.** Orca starts Claude Code in a terminal with `--dangerously-skip-permissions` (seen in the process command line), so a worker is never held at a permission screen, and a read-only seat is read-only only if its brief says so and you check `git status`. Under Orca, `CLAUDE_CONFIG_DIR` is Orca's Claude profile, whose `skills` folder links to `~/.claude/skills`, so one link there covers a Claude Code that Orca starts too. The transcripts are in that profile's `projects/`. Orca's catalog lists full Claude model ids as well as the aliases. Orca refuses `--model haiku --effort low` ("Agent claude model haiku does not support effort low"), though its catalog lists `low` for haiku, so use `--effort default` with haiku.
- **codex.** Under Orca, `CODEX_HOME` is Orca's account home: `~/Library/Application Support/orca/codex-accounts/<id>/home/`, not `~/.codex`. The rollouts and `models_cache.json` are there. That cache can lag: on 2026-10-27 it lacked `gpt-6.1-sol`, and an Orca worker still ran `gpt-6.1-sol`. Orca's catalog lists Codex models under `discovered`. Codex has no `live` list. A Codex coordinator waits in chunks: `orca orchestration check --wait --timeout-ms 45000`, repeated in the same exec session until the event arrives. This was seen in a real run. A Claude Code coordinator can wait once with a long timeout.
- **grok.** `worker-start --agent grok --model grok-4.7 --effort medium` exits 1 with `Agent grok does not support launch-time model selection. Omit --model to run the model from its own config.` Start it with `--agent grok` alone. It runs `[models] default` in `~/.grok/config.toml`. To change the model an Orca Grok worker runs, edit that key. A model or effort named in a brief does not change it. Orca's catalog lists Grok's ids under `live`. `worker-show` reports `launch.effective` as null, so read the model that ran from the Grok session record's `summary.json` and say it in your reply. Under Orca the effort is not settled: on one computer `default_reasoning_effort` was `high` and the session record said `medium`. Read the effort from the session record, and do not promise the file's value. In `inventory.md`, an Orca Grok worker's "Choose the model at start" is `no`, with the model from that key, and "Confirmed" records the model its session record says ran, as the one this computer gets. When a preference names a Grok model or effort, start Grok through its own CLI, as its adapter's Start me from outside says, even under Orca.

## Exact steps

### Opening a pull request and building a stack

Adds to the contract's steps. After `gh pr create`, link the pull request to the workspace: `orca reference add <pr-url> --worktree active`.

### Removing a worktree

Replaces the contract's form for a worktree Orca manages: `orca worktree rm --worktree <selector>`. Never `git worktree remove` or `rm -rf` on a worktree Orca manages, because Orca must forget it. Deleting is irreversible. Which worktrees to delete is the user's decision.

### New. Orca workers

- `worker-release` only after an accepted settlement.
- `worker-stop` and `worker-abandon` only on positive proof the agent stopped, and with the exact receipt from `orca skills get orchestration --reference references/recovery-and-cleanup.md`.
- `orca orchestration reset` is destructive. Never call it on your own.

## For users

- Orca adds supervised workers, durable runs, schedules, and remote environments to the harnesses it runs.
- An Orca automation runs a prompt on a schedule, which is how `run-on-schedule` is done here.

## Survey

- **Data folder.** `ORCA_USER_DATA_PATH` points at Orca's data folder.
- **What can run.** Every agent in `$ORCA_USER_DATA_PATH/agent-model-catalog.json` can run as an Orca worker. The file lists what Orca probed, with the efforts of each model. List it with the `jq` command in Launching harnesses, and survey each agent through the adapter the id map there names. An agent can have several entries, one per account, so `sort -u` drops the repeats. Treat an id as available when any entry lists it. An agent whose CLI is not installed cannot start.
- **Environments.** Record the saved Orca environments (`orca environment list`) under Environment in `inventory.md`.
- **Question.** Another vendor's agent as an Orca worker: allowed, allowed only for reading, or not allowed. Ask it after the generator's own questions, and write the answer as a sentence under `## Preferences`.

## Limits

- Nothing but the brief stops a worker from editing. Orca has no read-only flag, so check `git status` after a read-only worker settles.
- MCP servers do not cross agents. A worker loads only its own agent's MCP configuration.
- Remaining usage cannot be read. Orca has no command for it, and `orca status` does not report it. A limit shows up as an error when a start fails.
