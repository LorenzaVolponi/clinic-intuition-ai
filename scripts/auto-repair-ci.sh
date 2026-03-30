#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

mkdir -p reports

echo "[auto:repair:ci] npm ci"
npm ci

echo "[auto:repair:ci] lint"
npm run lint

echo "[auto:repair:ci] test"
npm test

echo "[auto:repair:ci] build"
npm run build

echo "[auto:repair:ci] smoke e2e"
bash scripts/smoke-e2e.sh

echo "[auto:repair:ci] npm audit report"
if npm audit --json > reports/npm-audit-report.json; then
  echo "[auto:repair:ci] npm audit completed sem bloqueios."
else
  echo "[auto:repair:ci] npm audit encontrou vulnerabilidades (relatório salvo)."
fi

echo "[auto:repair:ci] ✅ concluído"
