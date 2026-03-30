#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) não encontrado." >&2
  exit 1
fi

PR_NUMBER="${1:-${PR_NUMBER:-}}"
if [[ -z "$PR_NUMBER" ]]; then
  echo "Uso: $0 <pr_number>" >&2
  exit 1
fi

REPO="${GITHUB_REPOSITORY:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"

echo "[auto-pr] carregando metadados da PR #$PR_NUMBER em $REPO"
PR_JSON="$(gh pr view "$PR_NUMBER" --repo "$REPO" --json number,isDraft,mergeStateStatus,headRefName,headRepositoryOwner,headRepository,baseRefName,url)"

IS_DRAFT="$(jq -r '.isDraft' <<<"$PR_JSON")"
BASE_REF="$(jq -r '.baseRefName' <<<"$PR_JSON")"
HEAD_REF="$(jq -r '.headRefName' <<<"$PR_JSON")"
HEAD_OWNER="$(jq -r '.headRepositoryOwner.login' <<<"$PR_JSON")"
HEAD_REPO="$(jq -r '.headRepository.name' <<<"$PR_JSON")"

if [[ "$IS_DRAFT" == "true" ]]; then
  echo "[auto-pr] PR em draft. pulando."
  exit 0
fi

if [[ "$HEAD_OWNER/$HEAD_REPO" != "$REPO" ]]; then
  echo "[auto-pr] PR de fork ($HEAD_OWNER/$HEAD_REPO). sem push automático por segurança."
  exit 0
fi

echo "[auto-pr] base=$BASE_REF head=$HEAD_REF"

git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"

git fetch origin "$BASE_REF" "$HEAD_REF"
git checkout -B "auto-merge/$PR_NUMBER" "origin/$HEAD_REF"

set +e
git merge --no-edit "origin/$BASE_REF"
MERGE_STATUS=$?
set -e

if [[ $MERGE_STATUS -ne 0 ]]; then
  echo "[auto-pr] conflito detectado. aplicando resolução automática preferindo alterações da PR (--ours)."
  mapfile -t CONFLICT_FILES < <(git diff --name-only --diff-filter=U)

  if [[ ${#CONFLICT_FILES[@]} -eq 0 ]]; then
    echo "[auto-pr] merge falhou sem arquivos conflitantes listados." >&2
    exit 1
  fi

  for file in "${CONFLICT_FILES[@]}"; do
    git checkout --ours "$file"
    git add "$file"
  done

  git commit -m "chore(auto-merge): resolve conflitos automaticamente preferindo branch da PR"
fi

echo "[auto-pr] executando validações mínimas"
npm ci
npm test
npm run build

echo "[auto-pr] enviando branch atualizada"
git push origin "HEAD:$HEAD_REF"

echo "[auto-pr] habilitando auto-merge"
gh pr merge "$PR_NUMBER" --repo "$REPO" --squash --auto --delete-branch

echo "[auto-pr] concluído com sucesso"
