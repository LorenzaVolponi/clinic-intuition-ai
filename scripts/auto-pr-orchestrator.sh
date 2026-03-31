#!/usr/bin/env bash
set -euo pipefail

CURRENT_PR_NUMBER="${PR_NUMBER:-${1:-}}"
DEFAULT_BRANCH="${DEFAULT_BRANCH:-main}"

echo "[orchestrator] install"
npm ci

echo "[orchestrator] lint fix"
npm run lint -- --fix

echo "[orchestrator] tests"
npm test

echo "[orchestrator] build"
npm run build

echo "[orchestrator] commit auto-fixes (if any)"
if [[ -n "$(git status --porcelain)" ]]; then
  git config user.name "github-actions[bot]"
  git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
  git add -A
  git commit -m "chore(auto): repair, lint, test and build adjustments [skip ci]"
  git push origin "HEAD:${GITHUB_HEAD_REF:-${GITHUB_REF_NAME:-}}"
else
  echo "[orchestrator] no local changes to commit"
fi

if [[ -z "${GH_TOKEN:-${GITHUB_TOKEN:-}}" ]]; then
  echo "[orchestrator] GH_TOKEN/GITHUB_TOKEN ausente; finalizando sem operações de PR"
  exit 0
fi

export GH_TOKEN="${GH_TOKEN:-${GITHUB_TOKEN:-}}"

if [[ -n "$CURRENT_PR_NUMBER" ]]; then
  echo "[orchestrator] enable auto-merge for PR #$CURRENT_PR_NUMBER"
  gh pr merge "$CURRENT_PR_NUMBER" --auto --squash || true
fi

echo "[orchestrator] close all other open PRs"
OPEN_PRS="$(gh pr list --state open --base "$DEFAULT_BRANCH" --json number --jq '.[].number')"
for pr in $OPEN_PRS; do
  if [[ -n "$CURRENT_PR_NUMBER" && "$pr" == "$CURRENT_PR_NUMBER" ]]; then
    continue
  fi
  gh pr close "$pr" --comment "Fechada automaticamente pelo orquestrador para manter um único fluxo ativo de entrega." || true
done

echo "[orchestrator] done"
