# Waiting and schedules

## `wake-on-event`

- **A worker or a process.** Your harness adapter and each environment adapter that applies have a `wake-on-event` heading. Use the one the index's scope picks. Always pass a timeout to a wait command.
- **A PR.** `../poteto-mode/scripts/watch-pr/watch-pr` polls until it has a verdict. Wait on that process with the mechanisms above, and start it again after each push.
- **None of these.** A bounded shell loop, or stop and say what to re-run.

Foreground `sleep` commands past about 45 seconds are refused in some harnesses. Use a wait command, not a long sleep.

## `run-on-schedule`

- **The mechanism.** Your harness adapter and each environment adapter that applies have a `run-on-schedule` heading.
- **A tick that starts a new agent has no memory of the last.** The tick prompt carries everything: where the decision trail is (`durable-store`), the playbook to reread, and the stop condition. Do not rely on the earlier session's context.
- **Neither.** Skip the tick and tell the user to re-run by hand.
