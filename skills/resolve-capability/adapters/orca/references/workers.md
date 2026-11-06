# Orca workers

Facts checked on Orca 1.4.237. Orca's own contract is the version-matched guide: run `orca skills get orchestration` before your first worker and follow its coordinator loop. This file says how pstack uses it and does not replace it. Which agents take which flags is in the adapter's Launching harnesses section.

## The loop

Start one Run per task, then one worker per seat. Start the whole independent wave before you wait on any of it. Start Orca workers and your own harness's subagents in the same message when they should run at the same time.

```text
orca orchestration run-create --objective "<skill>: <task>" --json
orca orchestration worker-start --spec "<brief>" --agent <agent> --model <model> --effort <effort> --worktree <placement> --json
orca orchestration check --wait --types worker_done,escalation,question --timeout-ms 900000 --json
orca orchestration reply --id <message_id> --body "<answer>" --json
orca orchestration worker-release --dispatch <dispatch_id> --json
orca orchestration check --ack <delivery_id> --wait --types worker_done,escalation,question --timeout-ms 900000 --json
```

- If `worker-start` exits non-zero, do not relaunch. Read the receipt's `failedStage` and `residualResources`, then run `orca skills get orchestration --reference references/recovery-and-cleanup.md`.
- A `check` timeout or an empty result is a checkpoint, not a failure. After three empty waits, list with `orca orchestration worker-list --include-remote --json` and act on each row's `projection.nextAction`. Absence never authorizes stop, abandon, retry, or release.
- A valid `worker_done` settles the task. Do not follow it with `task-update --status completed`. Release a worker only after its settlement was accepted. Release is cleanup, not cancellation.
- Reattach to a Run after a restart with `orca orchestration run-use`.

## The brief

A spec is self-contained. It names the target, the change, the constraints, who may edit what, and the observable acceptance. End every spec with: "Write your full result to `<report path>`. Then send `worker_done` with `--report-path` as your preamble instructs." Read the report file, or `orca orchestration worker-read --dispatch <id> --source transcript`.

| A seat needs | Do |
| --- | --- |
| The `poteto-agent` rules | Start the spec with "Read `<pstack>/poteto-mode/SKILL.md` in full, including its Principles section, before any work." |
| To read only | Put "Read-only. Do not edit, commit, or push." in the spec and use `--worktree current`. Orca has no read-only flag, so check `git status` after the worker settles. |
| To write | `--worktree new-child`, so its edits land in its own checkout. A writer also gets its own ports and temp paths. |
| To start from another branch | `--base-branch <b>`, valid only with `new-child` or `new-top-level`. |
| To survive this computer sleeping | `--on <saved environment>`. List the environments with `orca environment list`. Without one the worker is local. |
| Files | List the paths in the spec. |
| A fresh start for follow-up work | A new worker with the consolidated scope. Only when the work needs the old worker's state, send to it with `orca orchestration send --to dispatch:<id>`. |

## Control

- Probe: `orca orchestration worker-show --dispatch <id>`. A live terminal can still hold a dead or stuck agent, so liveness is layered: `worker-list` gives the agent's verdict, `worker-show` gives the terminal's.
- Message a worker: `orca orchestration send --to dispatch:<id>`.
- Stop or abandon only on positive proof the agent stopped, with the exact recovery receipt: `orca orchestration worker-stop` or `worker-abandon`. Never substitute `terminal close` for a release.
- `orca orchestration reset` is destructive. Do not call it on your own.

## A worker that starts workers

A worker can run its own loop: it creates a Run, starts workers, and waits, as a sub-coordinator would. Nesting is limited. `worker-start` fails with `nested_worker_depth_exceeded` when it goes too deep, and creating another Run does not reset the depth. The guide does not state the limit and this was not run. Treat the error as the limit: when it fires, stop nesting and have the coordinator above start those workers itself. Prefer a wide wave to a deep chain.
