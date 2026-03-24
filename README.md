# MedInnova AI Lab

Plataforma educacional em React + Vite com backend Node para estudo médico com:

- simulador de casos clínicos com triagem inteligente;
- flashcards temáticos;
- quiz por área;
- MedBot para revisão guiada;
- timeline da evolução da medicina;
- backend de IA com prompt clínico rígido e validações de segurança.

## Como rodar

```bash
npm install
cp .env.example .env
npm run dev
```

Isso sobe:

- frontend Vite em `http://localhost:8080`
- backend MedInnova em `http://localhost:8787`

## Variáveis de ambiente

```bash
GROQ_API_KEY=your_secure_groq_key_here
GROQ_MODEL=llama-3.3-70b-versatile
BACKEND_PORT=8787
VITE_API_BASE_URL=
```

> Segurança: mantenha a chave apenas no `.env` local (nunca commite chaves reais no repositório).

### Configuração recomendada (local + Vercel)

- **Local**: crie `.env` com `cp .env.example .env` e preencha `GROQ_API_KEY`.
- Se frontend e API estiverem em domínios diferentes, configure `VITE_API_BASE_URL` com o host da API (ex.: `https://seu-app.vercel.app`).
- **Vercel**: adicione `GROQ_API_KEY` e `GROQ_MODEL` em **Project Settings → Environment Variables**.
- Após deploy, valide em:
  - `GET /api/health` → `providerConfigured: true` quando a chave estiver correta.

## Backend implementado

- endpoint `POST /api/clinical-analysis` com prompt de sistema clínico rigoroso;
- endpoint `POST /api/medbot` para tutor educacional;
- endpoint `POST /api/study-pack` para gerar 10 aulas + 10 perguntas randomizadas;
- endpoint `GET /api/health` com status do provedor;
- temperatura baixa e `top_p` reduzido para conter alucinação;
- validações backend para bloquear respostas inseguras (ex.: dor torácica sem ECG, mulher fértil com dor+nausea sem Beta-HCG, sintomas inventados).
- fallback local no frontend quando backend/IA estiver indisponível.
- fallback local também no backend para `clinical-analysis` e `medbot` quando o provedor externo falhar/estiver indisponível.
- em deploy Vercel, os handlers `api/*.js` também possuem fallback local para manter a plataforma funcional sem provider.
- rate limit básico por IP e `x-request-id` em todas as respostas para rastreabilidade.

## Testes

```bash
npm test
npm run build
npm run verify
```

Cobertura inicial inclui:
- validação clínica de segurança (`backend/validators.test.ts`);
- smoke tests dos endpoints (`backend/server.test.ts`) incluindo `study-pack`.

### Smoke test rápido local (API + frontend)

Com `npm run dev` rodando:

```bash
curl http://localhost:8787/api/health
curl http://localhost:8080/api/health
curl -X POST http://localhost:8787/api/medbot \
  -H "content-type: application/json" \
  -d '{"topicId":"cardiologia","question":"resuma IAM"}'
```

## Próximas melhorias recomendadas

1. Persistir histórico de chats, casos e desempenho do quiz.
2. Adicionar autenticação e trilhas por nível de formação.
3. Salvar auditoria das respostas bloqueadas pelo validador clínico.
4. Criar testes unitários/e2e para backend e frontend.
5. Expandir a base de conteúdo e critérios clínicos.

## Runbook para subir atualização

Se você quer um passo a passo direto para rodar, validar, commitar e subir PR sem erro:

- Veja `docs/UPDATE_RUNBOOK.md`.
- Documentação técnica completa: `docs/TECHNICAL_DOCUMENTATION.md`.
