# Runbook: subir atualização completa (backend + UX/UI)

Este guia é para você conseguir **rodar, validar, commitar e subir** a atualização sem quebrar nada.

## 1) Preparar ambiente

```bash
npm install
cp .env.example .env
```

Preencha no `.env`:

```bash
GROQ_API_KEY=...
GROQ_MODEL=llama-3.3-70b-versatile
BACKEND_PORT=8787
VITE_API_BASE_URL=
```

> Se frontend e API estiverem no mesmo host, deixe `VITE_API_BASE_URL` vazio.

## 2) Validar tudo antes de subir

```bash
npm run verify
```

Esse comando roda:
- lint
- testes
- build de produção

## 3) Rodar local (web + backend)

```bash
npm run dev
```

URLs esperadas:
- Frontend: `http://localhost:8080`
- Backend: `http://localhost:8787`

Smoke test rápido:

```bash
curl http://localhost:8787/api/health
curl http://localhost:8080/api/health
curl -X POST http://localhost:8787/api/medbot \
  -H "content-type: application/json" \
  -d '{"topicId":"cardiologia","question":"resuma IAM"}'

# geração por foco (flashcards, quiz, aulas) com objetivo + nonce
curl -X POST http://localhost:8787/api/study-pack \
  -H "content-type: application/json" \
  -d '{"topicId":"neurologia","focus":"flashcards","objective":"revisão prática de déficit focal","nonce":"smoke-a1"}'

curl -X POST http://localhost:8787/api/study-pack \
  -H "content-type: application/json" \
  -d '{"topicId":"infectologia","focus":"lessons","objective":"treino rápido para pronto atendimento","nonce":"smoke-b2"}'
```

Verifique no retorno:
- `flashcards`, `quiz` e `lessons` sempre preenchidos;
- variação de conteúdo ao trocar `nonce`;
- ausência de dose explícita (ex.: `500mg`) em conteúdo educacional.

## 4) Checklist UX/UI (mobile e web)

- Hero sem overflow horizontal no mobile.
- Botões principais clicáveis e com largura adequada no mobile.
- Tabs de estudo com rolagem horizontal funcionando.
- Geração IA por aba atualiza somente a seção pedida (flashcards/quiz/aulas).
- MedBot mostrando status claro de IA ativa vs fallback local.
- Scroll da conversa MedBot sem quebrar layout.

## 5) Commit e push

```bash
git add .
git commit -m "chore: atualização completa backend + UX/UI + validação"
git push origin <sua-branch>
```

## 6) Prompt/descrição pronta para PR

### Título sugerido
`MedInnova: full update for AI reliability, mobile UX/UI and release runbook`

### Corpo sugerido

```md
## Motivation
- Garantir funcionamento estável do backend IA e fallback local.
- Melhorar UX/UI mobile e web (principalmente hero, estudo e MedBot).
- Padronizar fluxo de validação e subida com runbook de release.

## Changes
- Robustez de integração IA no frontend (`VITE_API_BASE_URL`, health status de IA).
- Melhorias de UX/UI responsivo em hero, tabs de estudo e MedBot.
- Script de validação única (`npm run verify`) e documentação operacional.
- Runbook completo de commit/push/validação para subir atualização sem regressão.

## Testing
- npm run verify
- npm run dev
- curl /api/health (backend e via frontend)
- curl POST /api/medbot
```
