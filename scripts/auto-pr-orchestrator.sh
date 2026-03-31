#!/usr/bin/env bash
set -euo pipefail

CURRENT_PR_NUMBER="${PR_NUMBER:-${1:-}}"
DEFAULT_BRANCH="${DEFAULT_BRANCH:-main}"

echo "[orchestrator] running definitive pipeline"
bash scripts/definitive-auto-run.sh --ci ${CURRENT_PR_NUMBER:+--pr="$CURRENT_PR_NUMBER"}

if [[ -z "${GH_TOKEN:-${GITHUB_TOKEN:-}}" ]]; then
  echo "[orchestrator] GH_TOKEN/GITHUB_TOKEN ausente; finalizando sem operações de PR"
  exit 0
fi

export GH_TOKEN="${GH_TOKEN:-${GITHUB_TOKEN:-}}"

echo "[orchestrator] close all other open PRs"
OPEN_PRS="$(gh pr list --state open --base "$DEFAULT_BRANCH" --json number --jq '.[].number')"
for pr in $OPEN_PRS; do
  if [[ -n "$CURRENT_PR_NUMBER" && "$pr" == "$CURRENT_PR_NUMBER" ]]; then
    continue
  fi
  gh pr close "$pr" --comment "Fechada automaticamente pelo orquestrador para manter um único fluxo ativo de entrega." || true
done

echo "[orchestrator] done"
