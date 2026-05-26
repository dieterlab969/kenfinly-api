#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

git config core.hooksPath .githooks
chmod +x .githooks/*
chmod +x scripts/*.sh
git config alias.push-staging '!bash scripts/git-push-staging-and-watch.sh'

echo "Development setup complete: Git hooks, script permissions, and git push-staging alias are configured."
