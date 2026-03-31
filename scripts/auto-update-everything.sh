#!/usr/bin/env bash
set -euo pipefail

APPLY_UPDATES="false"
AUTO_COMMIT="false"
AUTO_PUSH="false"
TARGET_BRANCH="${TARGET_BRANCH:-${GITHUB_REF_NAME:-}}"

for arg in "$@"; do
  case "$arg" in
    --apply-updates) APPLY_UPDATES="true" ;;
    --commit) AUTO_COMMIT="true" ;;
    --push) AUTO_PUSH="true" ;;
    *)
      echo "Uso: bash scripts/auto-update-everything.sh [--apply-updates] [--commit] [--push]"
      exit 1
      ;;
  esac
done

echo "[auto-update] npm ci"
npm ci

if [[ "$APPLY_UPDATES" == "true" ]]; then
  echo "[auto-update] npm update"
  npm update
  echo "[auto-update] npm audit fix"
  npm audit fix || true
fi

echo "[auto-update] lint fix"
npm run lint -- --fix

echo "[auto-update] tests"
npm test

echo "[auto-update] build"
npm run build

echo "[auto-update] smoke e2e"
bash scripts/smoke-e2e.sh

echo "[auto-update] medbot + diagnosis review"
bash scripts/review-medbot-diagnosis.sh

if [[ "$AUTO_COMMIT" == "true" && -n "$(git status --porcelain)" ]]; then
  git add -A
  git commit -m "chore(auto): self-heal update, fixes and verification"
  echo "[auto-update] commit criado"
fi

if [[ "$AUTO_PUSH" == "true" ]]; then
  if [[ -z "$TARGET_BRANCH" ]]; then
    echo "[auto-update] TARGET_BRANCH indefinido para push"
    exit 1
  fi
  git push origin "HEAD:${TARGET_BRANCH}"
  echo "[auto-update] push concluído para ${TARGET_BRANCH}"
fi

echo "[auto-update] concluído com sucesso"
