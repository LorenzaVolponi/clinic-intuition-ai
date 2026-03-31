#!/usr/bin/env bash
set -euo pipefail

ISSUE_NUMBER="${ISSUE_NUMBER:-}"
PR_NUMBER="${PR_NUMBER:-}"

for arg in "$@"; do
  case "$arg" in
    --issue=*) ISSUE_NUMBER="${arg#*=}" ;;
    --pr=*) PR_NUMBER="${arg#*=}" ;;
    *)
      echo "Uso: bash scripts/auto-run-all-suggestions.sh [--issue=<n>] [--pr=<n>]"
      exit 1
      ;;
  esac
done

echo "[all] pipeline definitivo"
bash scripts/definitive-auto-run.sh

if [[ -n "$ISSUE_NUMBER" ]]; then
  echo "[all] tratando issue de conflito #${ISSUE_NUMBER}"
  ISSUE_NUMBER="$ISSUE_NUMBER" bash scripts/auto-handle-conflict-issue.sh
fi

if [[ -n "$PR_NUMBER" ]]; then
  echo "[all] rodando orquestrador para PR #${PR_NUMBER}"
  PR_NUMBER="$PR_NUMBER" bash scripts/auto-pr-orchestrator.sh
fi

echo "[all] concluído"
