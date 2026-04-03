#!/usr/bin/env bash
set -euo pipefail

WITH_PR_BOT=0
WITH_AUDIT=0

for arg in "$@"; do
  case "$arg" in
    --with-pr-bot) WITH_PR_BOT=1 ;;
    --with-audit) WITH_AUDIT=1 ;;
    *)
      echo "Argumento inválido: $arg"
      echo "Uso: bash scripts/auto-todos.sh [--with-pr-bot] [--with-audit]"
      exit 2
      ;;
  esac
done

run_step() {
  local label="$1"
  shift
  echo ""
  echo "🚧 ${label}"
  "$@"
  echo "✅ ${label}"
}

echo "🔥 AUTO-TODOS iniciado (pipeline completo do repositório)"

if [ "${WITH_AUDIT}" -eq 1 ]; then
  run_step "Pau na máquina + audit" bash scripts/pau-na-maquina.sh --repair-on-fail --with-audit
else
  run_step "Pau na máquina" npm run auto:pau-na-maquina
fi

run_step "Backend maintenance adicional" npm run auto:backend:maintain
run_step "Guard único" npm run auto:guard

if [ "${WITH_PR_BOT}" -eq 1 ]; then
  run_step "Orquestrador de PR automático" npm run auto:orchestrate:pr
fi

echo ""
echo "🏁 AUTO-TODOS finalizado com sucesso."
