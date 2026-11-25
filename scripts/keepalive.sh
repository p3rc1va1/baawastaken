#!/usr/bin/env bash
# GitHub switches off scheduled workflows in a public repo after 60 days without repository activity.
# If the newest commit is older than MAX_AGE_DAYS (default 45), make one empty commit so the schedule
# stays on. It costs one harmless redeploy about every six weeks of silence, and never happens while
# the channel is active. DRY_RUN=1 only prints what it would do.
set -euo pipefail

max_age_days="${MAX_AGE_DAYS:-45}"
last="$(git log -1 --format=%ct)"
age_days=$(( ( $(date +%s) - last ) / 86400 ))

if (( age_days < max_age_days )); then
  echo "keepalive: newest commit is ${age_days} days old (limit ${max_age_days}); nothing to do"
  exit 0
fi

echo "keepalive: newest commit is ${age_days} days old (limit ${max_age_days}); adding an empty commit"
if [[ "${DRY_RUN:-}" == "1" ]]; then
  echo "keepalive: dry run, would run: git commit --allow-empty -m 'chore(youtube-sync): keep schedule active'"
  exit 0
fi
git commit --allow-empty -m 'chore(youtube-sync): keep schedule active'
