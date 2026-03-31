#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log_step() {
  echo
  echo "========================================"
  echo "[auto:repair] $1"
  echo "========================================"
}

run_step() {
  local label="$1"
  shift
  log_step "$label"
  "$@"
}

run_step "Instalando dependências (npm install)" npm install
run_step "Aplicando lint --fix automático" npm run lint -- --fix
run_step "Revalidando lint" npm run lint
run_step "Executando suíte de testes" npm test
run_step "Gerando build de produção" npm run build
run_step "Executando smoke e2e local" bash scripts/smoke-e2e.sh

echo
echo "[auto:repair] ✅ Fluxo concluído com sucesso."
