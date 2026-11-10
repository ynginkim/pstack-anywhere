# Team-kit skills

Three skills come from Cursor's team kit and are rewritten here: `deslop`, `control-ui`, and `control-cli`. A user types `/deslop` before a commit and sees the code slop the branch added removed, with comments and prose left alone and behavior unchanged. A user types `/control-ui` or `/control-cli` with something to check and sees the agent drive the real app one step at a time, with the tool `drive-app` resolves to or a temporary harness, and clean up after itself.

## Sub-features

- `tk-deslop` removes defensive checks, `try`/`catch`, and nesting that the branch added on a trusted path. It leaves comments, keeps behavior, does not touch committed code outside the diff, and replies in one to three sentences.
- `tk-cli` reads `resolve-capability`, runs `detect.sh`, starts the program in its own `tmux` session or PTY, sends one input at a time, waits on a screen pattern instead of a fixed time, and ends the session.
- `tk-ui` reads `resolve-capability` and the adapter `detect.sh` printed, drives the page with the tool `drive-app` resolves to, takes a snapshot before acting, clicks by role or ref, checks the state after each action, and stops the server and the tab.

## How to get to it (user POV)

- Claude Code: `/deslop`, `/control-ui`, `/control-cli`.
- Codex: the same names with `$`.
- `poteto-mode` runs `deslop` before commit and the matching control skill when a change ships UI or a CLI.

## Driving it with vp

Preconditions:

- `deslop`, `control-ui`, `control-cli`, and `resolve-capability` are synced. The three team-kit skills have no global copy, so a Claude run reads the testbed's, and each control skill reaches `resolve-capability` through its relative path, which is the testbed's copy too. `resolve-capability` itself has a global copy, which a run that starts from another skill may read instead.
- `deslop` does not read `select-model`, so `--ignore-lock` is safe for it. The control skills read `resolve-capability`, whose section 1 says to read `select-model`, so they follow the Shared state rules in `../SKILL.md` and take no `--ignore-lock`.
- `tk-deslop` needs an uncommitted fixture in the testbed. Append this to `calc.js` and note the baseline `node -e 'console.log(JSON.stringify(require("./calc").rowTotals([[1,2,3],["4","5","6"],[]])))'`, which prints `[3,9,0]`:

  ```js

  // Adds up each row of a table and returns the totals.
  exports.rowTotals = (rows) => {
    const totals = [];
    for (const row of rows) {
      const values = row.map(Number);
      if (values !== undefined && values !== null) {
        if (Array.isArray(values)) {
          try {
            totals.push(exports.sum(values));
          } catch (err) {
            totals.push(0);
          }
        }
      }
    }
    return totals;
  };
  ```

- `tk-ui` needs a page outside the testbed: a `counter.html` with a `main[data-app=counter]`, an `<output id="count">0</output>`, and an Add button that increments it. Put it in a scratch folder.

- **deslop.** Run `$VP launch TK-deslop --agent claude --surface headless --ignore-lock --prompt "/deslop 커밋은 하지 마."`. In `$VP read`, the reply is one to three sentences. `git diff` in the testbed shows `rowTotals` flattened with the comment line unchanged and `sum` untouched, and the baseline command prints `[3,9,0]` again. Save the diff to the evidence folder, then `git checkout calc.js`, because `vp read` reports the pre-existing change as "no new changes" and `cleanup --revert` does not restore it.
- **control-cli.** Run `$VP launch TK-cli --agent claude --surface headless --prompt "/control-cli node REPL을 띄워서 calc.js를 require한 뒤 sum([1, 2, 3])이 무엇을 돌려주는지 확인해줘. 파일은 고치지 마."`. The record shows a `tmux new-session` with `node`, each `send-keys` followed by a pattern wait, a `kill-session`, and a reply of 3. Read the commands from the record, because `summary.txt` cuts long ones.
- **control-ui.** Run `$VP launch TK-ui --agent claude --prompt "/control-ui <folder>/counter.html 을 로컬 서버로 띄우고, Add 버튼을 두 번 누르면 Count가 2가 되는지 확인해줘. 파일은 고치지 마."` in an Orca terminal. The calls show `detect.sh`, the orca adapter's `drive-app` section, `orca skills get orca-cli`, `orca snapshot` before the first `orca click`, clicks by ref, the count read after each click, then the server killed and `orca tab close`.

## Gotchas

- 2026-11-10: TK-deslop-134106 failed only the reply length (six sentences under "End with a summary of one to three sentences"). After 14ce630, TK-deslop2-134543 passed. TK-cli-134155 failed the pattern wait and the transcript, because the skill's `tmux` example had no waits and `^> ` never matches: `capture-pane` drops trailing spaces. After 14ce630 added `wait_for`, TK-cli2-134618 passed. TK-ui-134312 passed through Orca's browser. A Codex review then found the `tmux` example kept going after a failed wait, named sessions by the second, and lost `NODE_OPTIONS` on a running server, and the PTY example quit before reading the answer. The fix wraps the `tmux` block in a fail-fast subshell with a `trap`, takes tmux's session id, passes `-e`, and gives the PTY a second read. Both blocks ran as written from SKILL.md against `node`, and the PTY block also against a child that ignores SIGTERM, but no agent run has used them yet. TK-cli, TK-cli2, and TK-ui ran with `--ignore-lock` while the lock was free, and none of them read `select-model`, though `resolve-capability` says to.
- Headless `control-ui` without Orca falls back to Playwright, and this computer had no Playwright browser downloaded on 2026-11-10 (only `ffmpeg` in `~/Library/Caches/ms-playwright`). A run there would try to download one. Use the Orca terminal surface, or install a browser first with the user's yes.
- A Codex low-effort plan of the Bug fix playbook (TK-route-134155) never opened the Opening a PR playbook, so it named neither `deslop` nor `no-comments`. That checks `poteto-mode` reading, not these skills.
