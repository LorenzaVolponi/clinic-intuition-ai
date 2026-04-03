# Plano de preparação para refatoração (fase 0)

## Objetivo da fase
Executar o pré-trabalho necessário para reduzir o projeto ao núcleo funcional de:

1. **Anamnese**
2. **Simulador clínico**

mantendo o objetivo educacional original da plataforma.

## 1) Mapeamento do estado atual

### Núcleo clínico (manter)
- Interface de entrada de dados de paciente: `src/components/PatientForm.tsx`.
- Exibição de resultado clínico: `src/components/DiagnosisResult.tsx`.
- Motor de análise/fallback local: `src/lib/aiClient.ts` + `src/lib/medicalKnowledge.ts`.
- API clínica: `api/clinical-analysis.js` e `backend/server.ts`.

### Módulos extras (despriorizar/remover da home)
- Trilhas de estudo, quiz, flashcards e timeline: `src/components/home/*`, `src/lib/studyContent.ts`, `api/study-pack.js`.
- Tutor MedBot: `src/components/home/MedBotSection.tsx`, `api/medbot.js`.

## 2) Escopo funcional do MVP

### Fluxo mínimo obrigatório
1. Usuário preenche anamnese básica.
2. Sistema valida os campos essenciais.
3. Sistema processa análise clínica (backend ou fallback local).
4. Sistema retorna hipóteses, triagem, exames e condutas educacionais.
5. Usuário consegue reiniciar para novo caso.

### Requisitos mantidos
- Uso educacional explícito e aviso de segurança.
- Fallback local funcional quando IA externa indisponível.
- Saída com foco em triagem, hipóteses e condutas iniciais.

## 3) Regras de negócio essenciais (baseline)
- Idade obrigatória entre 1 e 120.
- Gênero obrigatório.
- Sintomas obrigatórios (texto livre + sugestões por sistema).
- Duração obrigatória.
- Destaque para red flags e emergências.

## 4) Arquitetura alvo simplificada

### Front-end
- `src/pages/Index.tsx` como composição única de anamnese + resultado.
- `PatientForm` e `DiagnosisResult` como componentes principais.
- Componentes de estudo/home deixam de ser renderizados na landing principal.

### Back-end
- Manter endpoint `/api/clinical-analysis` como endpoint principal.
- Manter `/api/health` para visibilidade do provedor.
- Endpoints de estudo/medbot permanecem desativados com retorno `410` para reforçar o escopo atual.

## 5) Estratégia de migração
- **Fase 1 (concluída):** simplificar interface principal para anamnese + simulador.
- **Fase 2 (concluída):** desativar endpoints fora do escopo principal (`/api/medbot` e `/api/study-pack`) com retorno `410`.
- **Fase 3 (em andamento):** limpar dependências/módulos não usados e consolidar suíte mínima de testes voltada ao fluxo clínico.

## 6) Critérios de aceite da fase 1
- Home abre com foco em anamnese e simulador clínico.
- Fluxo de envio do formulário funciona.
- Resultado clínico com reset funciona.
- Build e testes passam.

## 7) Critérios adicionais da fase 2
- Rotas fora do escopo retornam `410` de forma consistente no backend e nos handlers serverless.
- Testes automatizados cobrem explicitamente as respostas `410` para `medbot` e `study-pack`.

## 8) Estrutura de segurança clínica (fase 3)
- Módulo dedicado em `backend/clinical-safety/` para concentrar prompt e regras de validação.
- Arquivos de compatibilidade (`backend/prompts.ts`, `backend/validators.ts`) mantidos como re-export para transição sem quebra.
