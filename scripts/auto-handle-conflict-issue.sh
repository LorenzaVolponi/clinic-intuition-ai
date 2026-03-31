#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) não encontrado." >&2
  exit 1
fi

ISSUE_NUMBER="${ISSUE_NUMBER:-${1:-}}"
if [[ -z "$ISSUE_NUMBER" ]]; then
  echo "Uso: ISSUE_NUMBER=<n> bash scripts/auto-handle-conflict-issue.sh" >&2
  exit 1
fi

REPO="${GITHUB_REPOSITORY:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"

TITLE="$(gh issue view "$ISSUE_NUMBER" --repo "$REPO" --json title -q .title)"
BODY="$(gh issue view "$ISSUE_NUMBER" --repo "$REPO" --json body -q .body)"
TEXT="${TITLE}"$'\n'"${BODY}"

PR_NUMBER="$(grep -Eo '#[0-9]+' <<<"$TEXT" | head -n1 | tr -d '#')"
if [[ -z "$PR_NUMBER" ]]; then
  echo "[conflict-issue] não foi possível extrair número de PR da issue #${ISSUE_NUMBER}"
  gh issue comment "$ISSUE_NUMBER" --repo "$REPO" --body "❌ Não consegui identificar a PR alvo automaticamente. Informe no corpo algo como **PR #123**."
  exit 1
fi

echo "[conflict-issue] issue #${ISSUE_NUMBER} -> PR #${PR_NUMBER}"

if bash scripts/auto-pr-conflict-fix-and-merge.sh "$PR_NUMBER"; then
  gh issue comment "$ISSUE_NUMBER" --repo "$REPO" --body "✅ Conflito tratado automaticamente para a PR #${PR_NUMBER}. Fluxo de validação e auto-merge acionado."
  gh issue close "$ISSUE_NUMBER" --repo "$REPO" --comment "Encerrando issue automática: conflito da PR #${PR_NUMBER} processado."
else
  gh issue comment "$ISSUE_NUMBER" --repo "$REPO" --body "⚠️ Falhei ao resolver automaticamente o conflito da PR #${PR_NUMBER}. Verifique logs da action e ajuste manual se necessário."
  exit 1
fi
