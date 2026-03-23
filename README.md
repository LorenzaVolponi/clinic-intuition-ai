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
```

## Backend implementado

- endpoint `POST /api/clinical-analysis` com prompt de sistema clínico rigoroso;
- endpoint `POST /api/medbot` para tutor educacional;
- temperatura baixa e `top_p` reduzido para conter alucinação;
- validações backend para bloquear respostas inseguras (ex.: dor torácica sem ECG, mulher fértil com dor+nausea sem Beta-HCG, sintomas inventados).

## Próximas melhorias recomendadas

1. Persistir histórico de chats, casos e desempenho do quiz.
2. Adicionar autenticação e trilhas por nível de formação.
3. Salvar auditoria das respostas bloqueadas pelo validador clínico.
4. Criar testes unitários/e2e para backend e frontend.
5. Expandir a base de conteúdo e critérios clínicos.


## Deploy na Vercel

- rotas serverless em `api/health.ts`, `api/clinical-analysis.ts` e `api/medbot.ts`;
- configuração de deploy em `vercel.json`;
- para produção, configure `GROQ_API_KEY` e `GROQ_MODEL` nas variáveis de ambiente da Vercel.
