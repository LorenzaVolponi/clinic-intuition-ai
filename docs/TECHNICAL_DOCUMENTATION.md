# MedInnova AI Lab — Documentação Técnica Completa

## 1) Visão geral do produto

O **MedInnova AI Lab** é uma plataforma educacional médica com arquitetura híbrida:

- **Frontend SPA** em React + Vite para experiência interativa (casos clínicos, MedBot, flashcards, quiz, timeline).
- **Backend API** em Node/Express para orquestração de IA, validações de segurança clínica e fallback local determinístico.
- **Deploy serverless opcional** via handlers `api/*.js` para execução em Vercel.

### Objetivo do produto

Entregar aprendizado clínico com foco em:

- raciocínio clínico estruturado;
- segurança do paciente (uso educacional);
- respostas objetivas e mobile-first;
- resiliência mesmo sem provedor externo de IA.

---

## 2) Arquitetura

## 2.1 Componentes

1. **Frontend (`src/`)**
   - Página principal `src/pages/Index.tsx` orquestra o estado global da sessão de estudo.
   - Blocos de UI em `src/components/home/*`.
   - Cliente de IA em `src/lib/aiClient.ts` para consumir `/api/health`, `/api/clinical-analysis`, `/api/medbot`, `/api/study-pack`.

2. **Backend local (`backend/server.ts`)**
   - Endpoints REST em Express.
   - Rate limit por IP/user-id.
   - Session isolation (`x-session-uuid`) e contador de interações.
   - Fallback local quando provider não configurado ou falha de inferência.

3. **Camada de prompts (`backend/prompts.ts`)**
   - Prompt clínico com regras anti-alucinação.
   - Prompt do MedBot com contrato JSON estruturado.
   - Prompt de estudo e aulas rápidas para geração de packs.

4. **Validação de segurança (`backend/validators.ts`)**
   - Reprovação de respostas clínicas que violam regras de segurança (ex.: dor torácica sem ECG).

5. **Serverless handlers (`api/*.js`)**
   - Contratos equivalentes aos endpoints principais para ambiente Vercel.

---

## 2.2 Fluxo de requisição (alto nível)

1. Usuário envia ação pelo frontend (ex.: perguntar ao MedBot).
2. `aiClient` envia payload JSON ao endpoint correspondente.
3. Backend:
   - valida payload (Zod + sanitizações);
   - aplica isolamento de sessão;
   - tenta inferência via Groq (cadeia de modelos);
   - normaliza/valida resposta;
   - fallback local se necessário.
4. Frontend recebe resposta estruturada e renderiza conteúdo + sugestões de próximos passos.

---

## 3) Estrutura de pastas (resumo)

- `src/pages/Index.tsx`: composição da aplicação.
- `src/components/home/*`: seções visuais (MedBot, Study, Timeline, etc.).
- `src/lib/aiClient.ts`: integração com backend.
- `src/lib/medicalKnowledge.ts`: heurísticas e fallback clínico local.
- `src/lib/studyContent.ts`: geração/estrutura de conteúdo de estudo.
- `backend/server.ts`: API principal Express.
- `backend/prompts.ts`: prompts de sistema.
- `backend/validators.ts`: validações clínicas de segurança.
- `api/*.js`: handlers serverless.
- `docs/UPDATE_RUNBOOK.md`: runbook operacional.

---

## 4) Contratos de API

## 4.1 `GET /api/health`

### Resposta

```json
{
  "ok": true,
  "providerConfigured": true,
  "model": "llama-3.3-70b-versatile",
  "modelFallbackChain": ["llama-3.3-70b-versatile", "llama-3.1-70b-versatile", "llama-3.1-8b-instant"]
}
```

---

## 4.2 `POST /api/clinical-analysis`

### Request

```json
{
  "patientData": {
    "name": "Paciente",
    "age": 58,
    "gender": "masculino",
    "symptoms": "dor torácica súbita",
    "duration": "2 horas"
  },
  "localAssessment": { "...": "objeto de fallback local" },
  "context": {
    "topicId": "cardiologia",
    "objective": "revisar SCA"
  }
}
```

### Comportamento

- Com Groq: resposta clínica estruturada e validada.
- Sem Groq/falha: retorna `localAssessment` com `analysisSource: "local"`.
- Em violação clínica crítica: HTTP `422` com `validationErrors`.

---

## 4.3 `POST /api/medbot`

### Request

```json
{
  "topicId": "neurologia",
  "question": "resuma AVC em 3 pontos",
  "history": [
    { "role": "user", "content": "oi" },
    { "role": "assistant", "content": "como posso ajudar?" }
  ],
  "userLevel": "intermediario",
  "context": {
    "objective": "revisão para prova",
    "quickFacts": ["time is brain"],
    "clinicalSummary": "déficit focal súbito",
    "userLevel": "intermediario"
  }
}
```

### Response (contrato atual)

```json
{
  "answer": "texto markdown",
  "source": "groq",
  "intent": "resumo",
  "suggestions": ["quiz", "caso clínico", "medicamentos"],
  "response": {
    "session_id": "uuid",
    "interaction_id": "uuid",
    "timestamp": "2026-03-24T00:00:00.000Z",
    "user_level": "intermediario",
    "intent": "resumo",
    "content": {
      "text": "markdown",
      "type": "text",
      "metadata": {
        "topic": "neurologia",
        "sources": ["Modelo Groq"],
        "difficulty": "medium",
        "estimated_read_time": 90
      }
    },
    "suggestions": ["quiz", "caso clínico", "medicamentos"],
    "session_state": {
      "total_interactions": 3,
      "topics_covered": ["neurologia"],
      "used_ids": ["..."]
    }
  }
}
```

### Regras técnicas

- validação de input (vazio, tamanho, termos de injeção);
- isolamento por `x-session-uuid`;
- cache de sessão em memória com TTL de 24h;
- fallback local estruturado e compatível com frontend.

---

## 4.4 `POST /api/study-pack`

### Request

```json
{ "topicId": "cardiologia" }
```

### Response

- `lessons[]`, `flashcards[]`, `quiz[]` (normalizados para cliente).
- fallback local gera 10 itens por coleção.

---

## 5) Isolamento de sessão e estado

- Middleware `sessionIsolation` define:
  - `sessionUuid`;
  - `interactionNumber` incremental;
  - timestamp da interação.
- Cache local em memória (`Map`) guarda:
  - interações;
  - tópicos cobertos;
  - IDs usados;
  - nível do usuário.
- Expiração automática por TTL (24h) reduz risco de sincronização indevida entre sessões.

> Observação: em ambiente serverless, o cache em memória é efêmero por instância.

---

## 6) Segurança, compliance e qualidade clínica

1. **Prompts restritivos** com foco educacional.
2. **Validações clínicas** no backend antes de devolver resposta ao cliente.
3. **Fallback local** para evitar indisponibilidade total.
4. **Bloqueio de payload inválido** com retorno HTTP 400.
5. **Rate limit básico** para proteção operacional.
6. **`x-request-id`** para rastreabilidade.

---

## 7) Frontend: integração e UX

- MedBot agora consome **payload estruturado** e mantém compatibilidade com `answer` simples.
- Mensagens do assistente exibem:
  - conteúdo formatado;
  - fonte legível;
  - intenção detectada;
  - chips de sugestão clicáveis.
- Persistência local:
  - histórico MedBot (últimas 20 mensagens);
  - tópico selecionado;
  - índice da timeline;
  - cache de study pack por tópico.

---

## 8) Configuração e execução

## 8.1 Variáveis de ambiente

- `GROQ_API_KEY`
- `GROQ_MODEL`
- `BACKEND_PORT`
- `VITE_API_BASE_URL`

## 8.2 Comandos

```bash
npm install
cp .env.example .env
npm run dev
```

Comandos de validação:

```bash
npm test
npm run build
npm run verify
```

---

## 9) Estratégia de testes

### Automatizados

- `backend/validators.test.ts`
- `backend/server.test.ts`

### Smoke test manual recomendado

```bash
curl http://localhost:8787/api/health
curl -X POST http://localhost:8787/api/medbot -H "content-type: application/json" -d '{"topicId":"cardiologia","question":"resuma IAM"}'
curl -X POST http://localhost:8787/api/study-pack -H "content-type: application/json" -d '{"topicId":"neurologia"}'
```

---

## 10) Observabilidade e troubleshooting

### Logs

- request log JSON com: método, path, status, duração, sessionUuid.

### Falhas comuns

1. **`providerConfigured=false`** em `/api/health`:
   - chave ausente/inválida no ambiente.
2. **HTTP 400 em `/api/medbot`**:
   - `question` vazio ou acima de 500 caracteres.
3. **Conteúdo não estruturado da IA**:
   - backend aplica fallback local automaticamente.

---

## 11) Limitações atuais

- Cache de sessão é in-memory (não distribuído).
- Sem autenticação/autorização por usuário final.
- Sem banco para histórico longitudinal.

---

## 12) Roadmap técnico sugerido

1. Persistência de sessão em Redis/Postgres.
2. Métricas estruturadas (latência por endpoint/modelo).
3. E2E tests (frontend + backend).
4. Feature flags por módulo de IA.
5. Painel de auditoria para respostas bloqueadas por validação.

---

## 13) Critério de pronto operacional

- [x] Backend responde `/api/health`, `/api/clinical-analysis`, `/api/medbot`, `/api/study-pack`.
- [x] Frontend integrado com fallback local.
- [x] Testes unitários/smoke passando.
- [x] Build de produção gerado com sucesso.
- [x] Documentação técnica centralizada e versionada.
