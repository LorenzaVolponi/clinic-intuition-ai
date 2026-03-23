# MedInnova AI Lab

Plataforma educacional em React + Vite com backend Node para estudo médico com:
Plataforma educacional em React + Vite para estudo médico com:

- simulador de casos clínicos com triagem inteligente;
- flashcards temáticos;
- quiz por área;
- MedBot para revisão guiada;
- timeline da evolução da medicina;
- backend de IA com prompt clínico rígido e validações de segurança.

## Como rodar

- sistema leve de conquistas para gamificar a sessão.

## Como rodar

# Dr. IA

Simulador educacional de raciocínio clínico construído com React, TypeScript, Vite e shadcn/ui.

## O que foi atualizado

- Motor clínico local com pontuação por sintomas, red flags, idade, sexo e duração.
- Triagem explícita por prioridade: **Emergência**, **Urgente**, **Prioritário** ou **Ambulatorial**.
- Hipóteses com score, exames sugeridos, ações imediatas e resumo clínico.
- Integração **opcional** com Groq usando **variável de ambiente**, sem chave hardcoded no código.
- Fallback automático para análise local caso a API não esteja configurada ou falhe.

## Configuração

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
## Variáveis de ambiente
### Variáveis de ambiente

```bash
VITE_GROQ_API_KEY=your_groq_key_here
VITE_GROQ_MODEL=llama-3.3-70b-versatile
```

> Importante: por ser um app Vite, variáveis `VITE_*` ficam expostas no bundle do navegador. Para produção, o ideal é mover a chamada da Groq para backend/proxy.

## O que o sistema entrega hoje

- análise clínica local com fallback seguro;
- refinamento opcional por Groq;
- perguntas e respostas de estudo por tema;
- navegação por seções inspirada em landing pages modernas;
- interface otimizada para explorar estudo + prática clínica no mesmo fluxo.

## Próximas melhorias recomendadas

1. Mover a integração com Groq para backend seguro.
2. Salvar histórico de estudo, quiz e casos em persistência real.
3. Adicionar autenticação e trilhas por nível de formação.
4. Criar testes unitários para motor clínico e gerador de estudo.
5. Expandir base de conteúdo com mais especialidades e multimídia.
> Atenção: como este projeto usa Vite, qualquer variável `VITE_*` fica acessível no bundle do navegador. Para produção, o ideal é mover a chamada da Groq para um backend/proxy e nunca expor a chave final ao cliente.

## Scripts

- `npm run dev` — desenvolvimento
- `npm run build` — build de produção
- `npm run lint` — lint
- `npm run preview` — preview local

## Próximas melhorias recomendadas

1. Criar backend para proteger a chave da API e registrar auditoria das análises.
2. Adicionar testes automatizados para o motor clínico e componentes principais.
3. Persistir histórico de casos simulados.
4. Incluir sinais vitais, comorbidades, medicamentos em uso e exame físico no formulário.
5. Expandir a base de conhecimento com mais especialidades e critérios diagnósticos.
