#!/usr/bin/env bash
# Safely merge upstream/main into the current branch without auto-commit or push.
#
# Usage (from repo root):
#   ./scripts/sync-upstream.sh
#   ./scripts/sync-upstream.sh --commit   # optional: commit after successful check
#
# Steps:
#   1. Refuse modified tracked files (untracked files are ignored)
#   2. git fetch upstream
#   3. git merge --no-commit --no-ff upstream/main
#   4. On conflict: print conflicted files and stop (no auto-resolve, no push)
#   5. npm install --ignore-scripts
#   6. npm run generate:models
#   7. npm run check
#   8. Prompt for manual review / commit (unless --commit)

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "$script_dir/.." && pwd)"
cd "$repo_root"

do_commit=false
for arg in "$@"; do
	case "$arg" in
		--commit)
			do_commit=true
			;;
		-h|--help)
			sed -n '2,20p' "$0"
			exit 0
			;;
		*)
			echo "sync-upstream: unknown argument: $arg" >&2
			echo "Usage: ./scripts/sync-upstream.sh [--commit]" >&2
			exit 2
			;;
	esac
done

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
	echo "sync-upstream: not inside a git work tree" >&2
	exit 1
fi

if ! git remote get-url upstream >/dev/null 2>&1; then
	echo "sync-upstream: missing 'upstream' remote" >&2
	echo "Add it with: git remote add upstream <upstream-url>" >&2
	exit 1
fi

# Refuse any modified/staged tracked files. Untracked files are allowed.
dirty_tracked="$(git status --porcelain --untracked-files=no | awk '{print}' || true)"
if [[ -n "$dirty_tracked" ]]; then
	echo "sync-upstream: tracked working tree is not clean. Commit, stash, or discard changes first:" >&2
	echo "$dirty_tracked" >&2
	if git status --porcelain --untracked-files=no | grep -F "Mac快捷键.md" >/dev/null 2>&1; then
		echo >&2
		echo "Note: Mac快捷键.md has local edits. Handle or exclude that file before syncing." >&2
	fi
	exit 1
fi

echo "==> Fetching upstream"
git fetch upstream

if ! git show-ref --verify --quiet refs/remotes/upstream/main; then
	echo "sync-upstream: upstream/main not found after fetch" >&2
	exit 1
fi

echo "==> Merging upstream/main (no commit)"
set +e
git merge --no-commit --no-ff upstream/main
merge_status=$?
set -e

if [[ "$merge_status" -ne 0 ]]; then
	echo >&2
	echo "sync-upstream: merge stopped with conflicts (or merge failure)." >&2
	echo "Conflicted / unmerged files:" >&2
	conflicted="$(git diff --name-only --diff-filter=U || true)"
	if [[ -n "$conflicted" ]]; then
		echo "$conflicted" >&2
	else
		git status --short >&2 || true
	fi
	echo >&2
	echo "Resolve conflicts manually, then run install/generate/check yourself." >&2
	echo "Do not push until you have reviewed and committed." >&2
	exit 1
fi

# Fast-forward / already-up-to-date still leave an uncommitted merge only when
# merge created a merge state. If already up to date, continue with verify steps.
if git diff --cached --quiet && git diff --quiet; then
	echo "==> Already up to date with upstream/main (nothing to merge)."
else
	echo "==> Merge staged (not committed)."
fi

echo "==> npm install --ignore-scripts"
npm install --ignore-scripts

echo "==> npm run generate:models"
npm run generate:models

echo "==> npm run check"
npm run check

echo
echo "sync-upstream: merge + install + generate + check succeeded."
echo "Review the staged changes, then commit manually:"
echo "  git status"
echo "  git commit"

if [[ "$do_commit" == true ]]; then
	if git diff --cached --quiet && git diff --quiet; then
		echo "sync-upstream: --commit requested but there is nothing to commit."
		exit 0
	fi
	git commit -m "$(cat <<'EOF'
chore: merge upstream/main

EOF
)"
	echo "Created commit. Push is still manual:"
	echo "  git push"
fi
