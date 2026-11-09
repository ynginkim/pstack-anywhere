# No environment

A session where `scripts/detect.sh` prints nothing has no supervised workers, no durable run, no inbox, and no schedules from an environment. It still has more than its own subagent tool.

- `spawn-worker`: start another product's CLI headless from the shell, as that product's Start me from outside section and `cli-workers.md` say. That needs the product installed and logged in. `select-model` records which are. When none is, run the seat on your own model and say in one line which product would run it.
- `control-agent` and `find-sessions`: the harness's own session tools, in its adapter.
- `coordinate-workers`: one tracker file in `durable-store`, or the plan in the reply.
- `run-remote` has no mechanism. `run-on-schedule` and `wake-on-event` use the harness's own, or the fallback in the index.
- When no other vendor is reachable, "several models together" means several models of your own vendor. Say that diversity is lower than a mixed panel would give.
- A read-only seat uses the harness's read-only subagent type, or the other product's read-only mode where its adapter names one, and a brief that says not to edit. Check `git status` after.

A harness's desktop app is a plain session in this sense, with a shell and no environment variables. What each app adds (parallel sessions, worktrees, scheduled tasks) is in its harness adapter's Surfaces section.
