#!/usr/bin/env bash
set -euo pipefail

echo "[auto-backend] lint"
npm run lint

echo "[auto-backend] tests"
npm run test

echo "[auto-backend] coherence guard"
npm run safety:coherence:guard

echo "[auto-backend] smoke backend"
npm run smoke:backend

echo "[auto-backend] build"
npm run build

echo "[auto-backend] done"
