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
MARKER="AUTO-CONFLICT-PR-${PR_NUMBER}"

PR_JSON="$(gh pr view "$PR_NUMBER" --repo "$REPO" --json number,title,url,headRefName,baseRefName,mergeStateStatus)"
PR_TITLE="$(jq -r '.title' <<<"$PR_JSON")"
PR_URL="$(jq -r '.url' <<<"$PR_JSON")"
HEAD_REF="$(jq -r '.headRefName' <<<"$PR_JSON")"
BASE_REF="$(jq -r '.baseRefName' <<<"$PR_JSON")"
MERGE_STATE="$(jq -r '.mergeStateStatus' <<<"$PR_JSON")"

ISSUE_TITLE="[auto] Resolver conflito de merge da PR #${PR_NUMBER}"
ISSUE_BODY=$(cat <<EOF
${MARKER}

## Conflito detectado automaticamente

- PR: #${PR_NUMBER} — ${PR_TITLE}
- URL: ${PR_URL}
- Base: \`${BASE_REF}\`
- Head: \`${HEAD_REF}\`
- Estado de merge reportado: \`${MERGE_STATE}\`

## Ação recomendada

1. Atualizar branch da PR com a base atual.
2. Resolver conflitos priorizando consistência funcional (não aplicar \`--ours\` cego).
3. Rodar validação:
   - \`npm test --silent\`
   - \`bash scripts/smoke-e2e.sh\`
   - \`npm run review:medbot:diagnosis\`

## Observação

Esta issue foi criada pelo bot para não deixar PR quebrada passar sem rastreabilidade.
EOF
)

EXISTING_ISSUE_NUMBER="$(gh issue list --repo "$REPO" --state open --search "$MARKER in:body" --json number -q '.[0].number')"

if [[ -n "${EXISTING_ISSUE_NUMBER:-}" && "${EXISTING_ISSUE_NUMBER:-null}" != "null" ]]; then
  gh issue comment "$EXISTING_ISSUE_NUMBER" --repo "$REPO" --body "Revalidação automática: conflito ainda ativo para PR #${PR_NUMBER}."
  ISSUE_NUMBER="$EXISTING_ISSUE_NUMBER"
else
  ISSUE_URL="$(gh issue create --repo "$REPO" --title "$ISSUE_TITLE" --body "$ISSUE_BODY" --label "bug")"
  ISSUE_NUMBER="$(basename "$ISSUE_URL")"
fi

gh pr comment "$PR_NUMBER" --repo "$REPO" --body "⚠️ Conflito de merge detectado. Issue automática aberta/atualizada: #${ISSUE_NUMBER}."
echo "issue_number=${ISSUE_NUMBER}"
