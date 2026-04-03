# Dr. IA — Anamnese e Simulador Clínico

Aplicação educacional em React + Vite com backend Node focada **exclusivamente** em:

- coleta de anamnese estruturada;
- simulação clínica com hipóteses diagnósticas;
- suporte de triagem e condutas iniciais em contexto didático.

## Como rodar

```bash
npm install
cp .env.example .env
npm run dev
```

Serviços locais:
- frontend Vite em `http://localhost:8080`
- backend em `http://localhost:8787`

## Variáveis de ambiente

```bash
GROQ_API_KEY=your_secure_groq_key_here
GROQ_MODEL=llama-3.3-70b-versatile
BACKEND_PORT=8787
VITE_API_BASE_URL=
```

## Fluxo principal

1. Preencha a anamnese (idade, gênero, sintomas e duração).
2. Envie o caso para análise.
3. Revise triagem, hipóteses, exames sugeridos e ações imediatas.
4. Reinicie para novo caso simulado.

## Endpoints ativos no escopo atual

- `GET /api/health`
- `POST /api/clinical-analysis`

### Endpoints desativados por escopo

- `POST /api/medbot` → `410`
- `POST /api/study-pack` → `410`

## Segurança

- Uso estritamente educacional.
- Não substitui avaliação médica real.
- Em emergência real, acione SAMU 192.
- Validação clínica defensiva no backend para bloquear respostas incompatíveis com sintomas explícitos e reduzir risco de alucinação.

## Documentação de refatoração

- Plano de preparação e escopo da reestruturação: `docs/RESTRUCTURE_PREPARATION.md`.
