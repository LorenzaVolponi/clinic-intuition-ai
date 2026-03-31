#!/usr/bin/env bash
set -euo pipefail

CI_MODE="false"
PR_NUMBER="${PR_NUMBER:-}"

for arg in "$@"; do
  case "$arg" in
    --ci) CI_MODE="true" ;;
    --pr=*) PR_NUMBER="${arg#*=}" ;;
    *)
      echo "Uso: bash scripts/definitive-auto-run.sh [--ci] [--pr=<numero>]"
      exit 1
      ;;
  esac
done

run_with_retry() {
  local label="$1"
  shift
  echo "[definitive] ${label}"
  if "$@"; then
    return 0
  fi
  echo "[definitive] falha em '${label}'. tentando auto-correção e retry..."
  npm ci || npm install
  "$@"
}

echo "[definitive] provisionando ambiente"
node -v
npm -v
npm ci || npm install

echo "[definitive] corrigindo código automaticamente (lint --fix)"
npm run lint -- --fix || true

run_with_retry "testes" npm test
run_with_retry "build" npm run build
run_with_retry "smoke e2e" bash scripts/smoke-e2e.sh
run_with_retry "review medbot + diagnóstico" bash scripts/review-medbot-diagnosis.sh

if [[ "$CI_MODE" == "true" && -n "$(git status --porcelain)" ]]; then
  echo "[definitive] aplicando commit automático de auto-correções"
  git config user.name "github-actions[bot]"
  git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
  git add -A
  git commit -m "chore(auto): definitive self-heal and verification fixes [skip ci]"
  git push origin "HEAD:${GITHUB_HEAD_REF:-${GITHUB_REF_NAME:-}}"
fi

if [[ "$CI_MODE" == "true" && -n "${GH_TOKEN:-${GITHUB_TOKEN:-}}" && -n "$PR_NUMBER" ]]; then
  export GH_TOKEN="${GH_TOKEN:-${GITHUB_TOKEN:-}}"
  echo "[definitive] habilitando auto-merge para PR #${PR_NUMBER}"
  gh pr merge "$PR_NUMBER" --auto --squash || true
fi

echo "[definitive] pipeline finalizado com sucesso"
