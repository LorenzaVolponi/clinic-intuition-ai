#!/usr/bin/env bash
set -euo pipefail

PORT="${BACKEND_PORT:-8787}"
LOG_FILE="/tmp/backend-smoke.log"

npx tsx backend/server.ts >"${LOG_FILE}" 2>&1 &
SERVER_PID=$!

cleanup() {
  if kill -0 "${SERVER_PID}" >/dev/null 2>&1; then
    kill "${SERVER_PID}" >/dev/null 2>&1 || true
    wait "${SERVER_PID}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

SERVER_READY=0
for _ in $(seq 1 40); do
  if curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1; then
    SERVER_READY=1
    break
  fi
  sleep 0.5
done

if [ "${SERVER_READY}" -ne 1 ]; then
  echo "Backend não iniciou em tempo hábil. Logs:"
  cat "${LOG_FILE}" || true
  exit 1
fi

HEALTH_JSON="$(curl -fsS "http://127.0.0.1:${PORT}/api/health")"
python - <<'PY' "${HEALTH_JSON}"
import json, sys
data = json.loads(sys.argv[1])
assert data.get("ok") is True, "health check did not return ok=true"
PY

read -r -d '' PAYLOAD <<'JSON' || true
{
  "patientData": {
    "name": "Paciente Smoke",
    "age": 34,
    "gender": "Feminino",
    "symptoms": "Cefaleia com aura visual e fotofobia",
    "duration": "1-7d"
  },
  "localAssessment": {
    "hypotheses": [
      {
        "name": "Enxaqueca com Aura",
        "probability": "Alta",
        "treatment": "Analgésico e antiemético conforme protocolo",
        "explanation": "Compatível com cefaleia e aura visual.",
        "differentials": ["Cefaleia secundária"],
        "recommendedExams": ["Exame neurológico"],
        "redFlags": ["déficit neurológico persistente"],
        "score": 82
      },
      {
        "name": "Cefaleia secundária",
        "probability": "Moderada",
        "treatment": "Avaliação clínica dirigida",
        "explanation": "Necessário excluir red flags.",
        "differentials": ["AVC (quando sinais focais)"],
        "recommendedExams": ["Neuroimagem se alarme"],
        "redFlags": ["cefaleia súbita"],
        "score": 55
      },
      {
        "name": "AVC (quando sinais focais)",
        "probability": "Baixa",
        "treatment": "Encaminhar se déficit focal",
        "explanation": "Baixa sem sinais focais no relato.",
        "differentials": ["Enxaqueca com aura"],
        "recommendedExams": ["TC de crânio se red flags"],
        "redFlags": ["hemiparesia"],
        "score": 30
      }
    ],
    "triageLevel": "Prioritário",
    "triageReason": "Sem sinais de emergência no relato",
    "suggestedExams": ["Exame neurológico"],
    "immediateActions": ["Reavaliar evolução clínica"],
    "clinicalSummary": "Quadro compatível com enxaqueca com aura.",
    "analysisSource": "local"
  },
  "context": {
    "topicId": "clinica-geral",
    "objective": "simulacao-clinica"
  }
}
JSON

ANALYSIS_JSON="$(curl -fsS -X POST "http://127.0.0.1:${PORT}/api/clinical-analysis" \
  -H "Content-Type: application/json" \
  -d "${PAYLOAD}")"

python - <<'PY' "${ANALYSIS_JSON}"
import json, sys
data = json.loads(sys.argv[1])
assert isinstance(data.get("hypotheses"), list) and len(data["hypotheses"]) >= 1, "missing hypotheses"
assert data.get("triageLevel"), "missing triageLevel"
assert data.get("clinicalSummary"), "missing clinicalSummary"
PY

echo "Backend smoke check OK"
