#!/usr/bin/env bash
# Copy the latest cursor/plugins/pstack, and the cursor-team-kit files this fork bundles,
# onto the `upstream` branch. Prints the new commit, or nothing when upstream is already current.
set -euo pipefail

# The team-kit paths this fork adapted (see MIRROR.md). They land under cursor-team-kit/ on the branch.
team_kit=(LICENSE skills/deslop skills/control-ui skills/control-cli)

repo=$(git rev-parse --show-toplevel)
tmp=$(mktemp -d)
trap 'git -C "$repo" worktree remove --force "$tmp/wt" 2>/dev/null || true; rm -rf "$tmp"' EXIT

git clone -q --depth 1 --filter=blob:none --sparse https://github.com/cursor/plugins.git "$tmp/cursor"
git -C "$tmp/cursor" sparse-checkout set pstack cursor-team-kit
sha=$(git -C "$tmp/cursor" rev-parse --short HEAD)

git -C "$repo" worktree add -q "$tmp/wt" upstream
rsync -a --delete --exclude .git --exclude /cursor-team-kit/ "$tmp/cursor/pstack/" "$tmp/wt/"
rm -rf "$tmp/wt/cursor-team-kit"
for path in "${team_kit[@]}"; do
  # A path Cursor deleted is left out, so the report lists it as removed.
  [ -e "$tmp/cursor/cursor-team-kit/$path" ] || continue
  mkdir -p "$tmp/wt/cursor-team-kit/$(dirname "$path")"
  cp -R "$tmp/cursor/cursor-team-kit/$path" "$tmp/wt/cursor-team-kit/$path"
done
git -C "$tmp/wt" add -A
if git -C "$tmp/wt" diff --cached --quiet; then
  exit 0
fi
git -C "$tmp/wt" commit -q -m "upstream: cursor/plugins @ $sha (pstack, cursor-team-kit)"
git -C "$tmp/wt" log --oneline -1
