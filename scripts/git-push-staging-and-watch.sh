#!/usr/bin/env bash
set -euo pipefail

remote="${1:-origin}"
branch="${2:-staging}"
repo_root="$(git rev-parse --show-toplevel)"
watcher="${repo_root}/scripts/jenkins-watch.sh"

before_build="$("$watcher" --print-last-build)"
git push "$remote" "$branch"
"$watcher" --since-build "$before_build"
