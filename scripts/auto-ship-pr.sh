#!/usr/bin/env bash
set -euo pipefail

BASE_BRANCH="${BASE_BRANCH:-main}"
COMMIT_MESSAGE="${COMMIT_MESSAGE:-chore(auto): sync validated updates}"
PR_TITLE="${PR_TITLE:-chore(auto): sync validated updates}"
PR_BODY="${PR_BODY:-PR criada automaticamente por scripts/auto-ship-pr.sh após validação local.}"
MERGE_METHOD="${MERGE_METHOD:-squash}"

if ! command -v gh >/dev/null 2>&1; then
  echo "[auto-ship] GitHub CLI (gh) não encontrado." >&2
  exit 1
fi

CURRENT_BRANCH="$(git branch --show-current)"
if [[ -z "$CURRENT_BRANCH" ]]; then
  echo "[auto-ship] Não foi possível identificar a branch atual." >&2
  exit 1
fi

if [[ "$CURRENT_BRANCH" == "$BASE_BRANCH" ]]; then
  echo "[auto-ship] Você está na branch base ($BASE_BRANCH). Use uma branch de trabalho." >&2
  exit 1
fi

echo "[auto-ship] executando validação completa"
npm run auto:repair

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "[auto-ship] detectadas mudanças locais, criando commit automático"
  git add -A
  git commit -m "$COMMIT_MESSAGE"
else
  echo "[auto-ship] sem mudanças locais pendentes para commit"
fi

echo "[auto-ship] enviando branch $CURRENT_BRANCH"
git push -u origin "$CURRENT_BRANCH"

PR_NUMBER="$(gh pr list --head "$CURRENT_BRANCH" --base "$BASE_BRANCH" --json number -q '.[0].number' || true)"

if [[ -z "${PR_NUMBER:-}" ]]; then
  echo "[auto-ship] criando nova PR"
  gh pr create \
    --base "$BASE_BRANCH" \
    --head "$CURRENT_BRANCH" \
    --title "$PR_TITLE" \
    --body "$PR_BODY"
  PR_NUMBER="$(gh pr list --head "$CURRENT_BRANCH" --base "$BASE_BRANCH" --json number -q '.[0].number')"
else
  echo "[auto-ship] PR #$PR_NUMBER já existe"
fi

echo "[auto-ship] aguardando checks da PR #$PR_NUMBER"
gh pr checks "$PR_NUMBER" --watch

echo "[auto-ship] habilitando merge automático"
gh pr merge "$PR_NUMBER" --"$MERGE_METHOD" --auto --delete-branch

echo "[auto-ship] ✅ concluído"
