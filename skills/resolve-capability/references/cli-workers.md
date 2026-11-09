# Workers started from the shell

Any session with a shell can start another product's CLI without its interface. No environment is needed for that. What an environment adds is supervision: a run record that survives a restart, an inbox, a report-file protocol, and worktrees it manages. Without one you start the process, wait for it, and read its output yourself.

Each harness adapter's Start me from outside section gives the command for its product, its flags, its read-only mode, where the answer lands, and what was seen when it ran. Read the target's section before the first start. Run the command from the shell tool. Start one in the background when you have other work (your harness adapter's `wake-on-event` heading says how), write its answer to a file, and wait with `wake-on-event`.

## Rules

- Some CLIs wait forever on an open stdin. When the target's Start me from outside says to close stdin, end the command with `< /dev/null`. A log whose only line is a message about reading stdin means this, not a slow model.
- The report is the output file or the JSON answer. There is no `worker_done` message and no inbox, so wait on the process, not on a message.
- Silence is not a hang. With `--output-format json` a run prints nothing until it ends, and a review can run past five minutes. A coordinating session once took six silent minutes for a hang and killed two reviewers that were still working. Before you stop one, look at its session record, which the target's adapter names under `find-sessions`. A record that still grows is working.
- A process you started dies with the session that started it, unless the target's adapter names a background mode that outlives it, or you detached it yourself. Say so when the work is long.
- A seat that writes needs `isolate-checkout`. A seat that reads is held by the product's own read-only mode where its adapter names one, and by the brief. Check `git status` after either.
- MCP servers do not cross products, and remaining usage cannot be read. A limit shows up as an error.
- Name the model and effort you asked for and the one the output says ran. They can differ.
