#!/usr/bin/env bash
set -euo pipefail

REPAIR_ON_FAIL=0
WITH_AUDIT=0

for arg in "$@"; do
  case "$arg" in
    --repair-on-fail) REPAIR_ON_FAIL=1 ;;
    --with-audit) WITH_AUDIT=1 ;;
    *)
      echo "Argumento inválido: $arg"
      echo "Uso: bash scripts/pau-na-maquina.sh [--repair-on-fail] [--with-audit]"
      exit 2
      ;;
  esac
done

TEMP_GENERATED_FILE="/tmp/generated-disease-possibilities.json"
FAILED_STEP=""

cleanup() {
  if [ -f "${TEMP_GENERATED_FILE}" ]; then
    rm -f "${TEMP_GENERATED_FILE}" || true
  fi
}
trap cleanup EXIT

on_error() {
  local exit_code=$?
  echo "❌ Falha detectada no passo: ${FAILED_STEP:-desconhecido}"
  if [ "${REPAIR_ON_FAIL}" -eq 1 ]; then
    echo "🛠️ Executando auto-reparo CI..."
    npm run auto:repair:ci || true
  fi
  exit "${exit_code}"
}
trap on_error ERR

run_step() {
  local label="$1"
  shift
  echo ""
  echo "▶️ ${label}"
  FAILED_STEP="${label}"
  "$@"
  echo "✅ ${label}"
}

echo "🚀 Iniciando pipeline completo: PAU NA MÁQUINA"

run_step "Lint" npm run lint
run_step "Testes" npm run test
run_step "Guard de coerência clínica" npm run safety:coherence:guard
run_step "Smoke backend" npm run smoke:backend
run_step "Build" npm run build
run_step "Gerador >10k hipóteses (arquivo temporário)" npm run safety:generate:10k -- "${TEMP_GENERATED_FILE}"

if [ "${WITH_AUDIT}" -eq 1 ]; then
  run_step "Security audit (high)" npm audit --audit-level=high
fi

echo ""
echo "🏁 Pipeline completo finalizado com sucesso."
