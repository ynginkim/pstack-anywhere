#!/bin/sh
# Prints the id of each environment adapter whose detect.sh exits 0. Prints nothing when no environment is here.
adapters="$(cd "$(dirname "$0")/../adapters" && pwd)"
for dir in "$adapters"/*/; do
  [ -f "$dir/detect.sh" ] || continue
  if sh "$dir/detect.sh" >/dev/null 2>&1; then
    basename "$dir"
  fi
done
exit 0
