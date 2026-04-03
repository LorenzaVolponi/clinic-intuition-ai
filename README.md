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
- Se a IA externa responder fora das regras de segurança, o backend força fallback local automaticamente.

### Referências regulatórias recomendadas (Brasil)

- LGPD (Lei nº 13.709/2018): https://www.planalto.gov.br/ccivil_03/_Ato2015-2018/2018/Lei/L13709.htm
- Código de Ética Médica (CFM nº 2.217/2018): https://sistemas.cfm.org.br/normas/visualizar/resolucoes/BR/2018/2217
- Telemedicina (CFM nº 2.314/2022): https://sistemas.cfm.org.br/normas/arquivos/resolucoes/BR/2022/2314_2022.pdf

## Documentação de refatoração

- Plano de preparação e escopo da reestruturação: `docs/RESTRUCTURE_PREPARATION.md`.

## Operação contínua (full time)

- Guard contínuo local: `npm run auto:guard:watch`
- Guard contínuo no GitHub Actions: `.github/workflows/continuous-safety-guard.yml` (a cada 6 horas)
- Para correção assistida periódica: `.github/workflows/daily-auto-guard.yml`

## Checagem determinística de interpretação do caso

Para validar o que o parser clínico extrai do relato livre antes da IA:

```bash
CASE_TEXT=\"relato clínico aqui\" CASE_DURATION=\"6-24h\" npm run safety:parse:case
```

Para validar a escada obrigatória de hipóteses `Alta -> Moderada -> Baixa`:

```bash
CASE_TEXT=\"relato clínico aqui\" CASE_DURATION=\"1-7d\" CASE_AGE=\"35\" CASE_GENDER=\"Feminino\" npm run safety:check:ladder
```
