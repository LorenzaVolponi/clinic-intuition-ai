#!/usr/bin/env bash
set -u

MODE="once"
INTERVAL_SECONDS="300"
LOG_DIR="logs"
LOG_FILE="$LOG_DIR/auto-guard.log"
STATUS_FILE="$LOG_DIR/auto-guard-status.json"
AUTO_COMMIT="${AUTO_COMMIT:-0}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --watch)
      MODE="watch"
      shift
      ;;
    --once)
      MODE="once"
      shift
      ;;
    --interval)
      INTERVAL_SECONDS="$2"
      shift 2
      ;;
    *)
      echo "Parâmetro desconhecido: $1"
      exit 1
      ;;
  esac
done

mkdir -p "$LOG_DIR"

timestamp() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

run_step() {
  local name="$1"
  local cmd="$2"

  echo "[$(timestamp)] ▶ $name" | tee -a "$LOG_FILE"
  if bash -lc "$cmd" >>"$LOG_FILE" 2>&1; then
    echo "[$(timestamp)] ✅ $name" | tee -a "$LOG_FILE"
    return 0
  fi

  echo "[$(timestamp)] ❌ $name" | tee -a "$LOG_FILE"
  return 1
}

write_status() {
  local ok="$1"
  local msg="$2"
  cat > "$STATUS_FILE" <<JSON
{
  "timestamp": "$(timestamp)",
  "ok": $ok,
  "message": "${msg//"/\\"}"
}
JSON
}

maybe_commit_changes() {
  if [[ "$AUTO_COMMIT" != "1" ]]; then
    return 0
  fi

  if ! git diff --quiet || ! git diff --cached --quiet; then
    git add -A
    git commit -m "chore(auto-guard): lint/build/test maintenance $(timestamp)" >>"$LOG_FILE" 2>&1 || true
  fi
}

run_cycle() {
  echo "[$(timestamp)] ===== Iniciando ciclo auto-guard =====" | tee -a "$LOG_FILE"

  run_step "Dependências (npm ci)" "npm ci" || {
    write_status false "Falha em npm ci"
    return 1
  }

  run_step "Lint com autofix" "npm run lint -- --fix" || {
    write_status false "Falha no lint"
    return 1
  }

  run_step "Testes" "npm test" || {
    write_status false "Falha nos testes"
    return 1
  }

  run_step "Build" "npm run build" || {
    write_status false "Falha no build"
    return 1
  }

  maybe_commit_changes
  write_status true "Ciclo concluído com sucesso"
  echo "[$(timestamp)] ===== Ciclo finalizado =====" | tee -a "$LOG_FILE"
  return 0
}

if [[ "$MODE" == "once" ]]; then
  run_cycle
  exit $?
fi

while true; do
  run_cycle || true
  echo "[$(timestamp)] ⏳ Próximo ciclo em ${INTERVAL_SECONDS}s" | tee -a "$LOG_FILE"
  sleep "$INTERVAL_SECONDS"
done
