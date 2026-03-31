#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

LOG_FILE="/tmp/medinnova-review.log"
PID_FILE="/tmp/medinnova-review.pid"

cleanup() {
  if [[ -f "$PID_FILE" ]]; then
    kill "$(cat "$PID_FILE")" >/dev/null 2>&1 || true
    rm -f "$PID_FILE"
  fi
}
trap cleanup EXIT

npm run start:server >"$LOG_FILE" 2>&1 &
echo $! >"$PID_FILE"

for _ in {1..25}; do
  if curl -fsS http://127.0.0.1:8787/api/health >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "[review] medbot fluidez"
MEDBOT_JSON="$(curl -fsS -X POST http://127.0.0.1:8787/api/medbot \
  -H 'Content-Type: application/json' \
  -d '{"topicId":"emergencias","question":"quero um papo normal sobre sepse e impacto clínico","context":{"objective":"conversa natural e prática"}}')"

echo "$MEDBOT_JSON" | node -e '
const fs = require("fs");
const payload = JSON.parse(fs.readFileSync(0, "utf8"));
const text = String(payload?.response?.content?.text || payload?.answer || "");
if (!text) throw new Error("MedBot sem texto");
if (/Me manda em uma frase/i.test(text)) throw new Error("MedBot voltou a pedir classificação rígida");
console.log("[ok] medbot sem loop de formato");
'

echo "[review] hipóteses diagnósticas variam por caso"
RESP_CHEST="$(curl -fsS -X POST http://127.0.0.1:8787/api/clinical-analysis \
  -H 'Content-Type: application/json' \
  -d '{"patientData":{"name":"A","age":58,"gender":"masculino","symptoms":"dor torácica em aperto com sudorese e dispneia","duration":"< 6h"},"localAssessment":{"hypotheses":[{"name":"SCA","probability":"Alta","treatment":"encaminhar","explanation":"risco","differentials":["TEP"],"recommendedExams":["ECG"],"redFlags":["instabilidade"],"score":90}],"triageLevel":"Emergência","triageReason":"alto risco","suggestedExams":["ECG"],"immediateActions":["monitorização"],"clinicalSummary":"alto risco","analysisSource":"local"}}')"

RESP_URINARY="$(curl -fsS -X POST http://127.0.0.1:8787/api/clinical-analysis \
  -H 'Content-Type: application/json' \
  -d '{"patientData":{"name":"B","age":24,"gender":"feminino","symptoms":"disúria, polaciúria e dor suprapúbica sem febre","duration":"1-7d"},"localAssessment":{"hypotheses":[{"name":"ITU","probability":"Alta","treatment":"encaminhar","explanation":"risco","differentials":["Pielonefrite"],"recommendedExams":["EAS"],"redFlags":["instabilidade"],"score":80}],"triageLevel":"Prioritário","triageReason":"sintomas urinários","suggestedExams":["EAS"],"immediateActions":["hidratação"],"clinicalSummary":"quadro urinário","analysisSource":"local"}}')"

node -e '
const chest = JSON.parse(process.argv[1]);
const urinary = JSON.parse(process.argv[2]);
const chestTop = chest?.hypotheses?.[0]?.name || "";
const urinaryTop = urinary?.hypotheses?.[0]?.name || "";
if (!chestTop || !urinaryTop) throw new Error("Resposta sem hipótese principal");
if (chestTop === urinaryTop) throw new Error(`Hipótese principal repetida: ${chestTop}`);
console.log("[ok] hipóteses principais diferentes por caso");
' "$RESP_CHEST" "$RESP_URINARY"

echo "[review] ok"
