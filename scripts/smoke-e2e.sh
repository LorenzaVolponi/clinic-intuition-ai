#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

LOG_FILE="/tmp/medinnova-smoke.log"
PID_FILE="/tmp/medinnova-smoke.pid"

cleanup() {
  if [[ -f "$PID_FILE" ]]; then
    kill "$(cat "$PID_FILE")" >/dev/null 2>&1 || true
    rm -f "$PID_FILE"
  fi
}
trap cleanup EXIT

npm run start:server >"$LOG_FILE" 2>&1 &
echo $! >"$PID_FILE"
sleep 3

echo "[smoke] health"
curl -fsS http://127.0.0.1:8787/api/health >/dev/null

echo "[smoke] medbot"
curl -fsS -X POST http://127.0.0.1:8787/api/medbot \
  -H 'Content-Type: application/json' \
  -d '{"topicId":"cardiologia","question":"continuar revisão com red flags","context":{"objective":"priorizar risco"}}' >/dev/null

echo "[smoke] study-pack"
curl -fsS -X POST http://127.0.0.1:8787/api/study-pack \
  -H 'Content-Type: application/json' \
  -d '{"topicId":"infectologia","objective":"foco em sepse","focus":"quiz","nonce":"smoke01"}' >/dev/null

echo "[smoke] clinical-analysis"
curl -fsS -X POST http://127.0.0.1:8787/api/clinical-analysis \
  -H 'Content-Type: application/json' \
  -d '{"patientData":{"age":45,"gender":"masculino","symptoms":"dor no peito com sudorese","duration":"1h"},"localAssessment":{"hypotheses":[{"name":"SCA","probability":"Alta","treatment":"encaminhar","explanation":"risco","differentials":["TEP"],"recommendedExams":["ECG"],"redFlags":["instabilidade"],"score":90}],"triageLevel":"Emergência","triageReason":"alto risco","suggestedExams":["ECG"],"immediateActions":["monitorização"],"clinicalSummary":"alto risco","analysisSource":"local"}}' >/dev/null

echo "[smoke] ok"
