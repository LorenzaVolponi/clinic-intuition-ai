# Arquitetura de conhecimento clínico

Este projeto mantém uma arquitetura em camadas para não depender 100% de banco, rede ou IA durante a análise local.

## Camada 1 — base local segura

- `src/lib/medicalKnowledge.ts` continua contendo `FALLBACK_MEDICAL_CONDITIONS` como core seguro.
- `buildLocalAssessment` e `findMatchingConditions` continuam síncronos e defensivos.
- Se o pacote JSON versionado estiver inválido, o loader retorna automaticamente o fallback TypeScript.

## Camada 2 — JSON clínico versionado

A primeira etapa implementada é a separação dos dados clínicos carregáveis:

- `data/clinical-knowledge/conditions.v1.json`: condições clínicas publicadas/revisadas.
- `data/clinical-knowledge/sources.v1.json`: catálogo inicial de fontes permitidas para enriquecimento futuro.
- `src/lib/clinicalKnowledgeSchema.ts`: schema Zod rígido para validar condições, status, versão e revisão.
- `scripts/validate-clinical-knowledge.ts`: validação CLI para CI/local.

Status aceitos para condições:

- `draft`: rascunho, não entra no runtime ativo.
- `reviewed`: revisado, pode entrar no runtime ativo.
- `published`: publicado, pode entrar no runtime ativo.
- `deprecated`: obsoleto, não entra no runtime ativo.

## Camada 3 — próxima fase, ainda não implementada

A evolução recomendada continua sendo incremental:

1. Criar tabelas Postgres para `clinical_conditions`, sintomas, red flags, diferenciais, exames, fontes e assertions clínicas.
2. Semear o banco a partir de `conditions.v1.json`.
3. Manter carregamento em cascata: banco publicado → JSON versionado → fallback TypeScript.
4. Adicionar busca estruturada em SQL antes de qualquer busca vetorial.
5. Adicionar pgvector apenas para explicações e trechos curtos com fonte, não para decisão clínica crítica.

## Workers futuros

Workers de PubMed/ICD/guidelines devem alimentar uma base curada, não responder diretamente ao usuário:

```text
Source Discovery → Ingestion Queue → Extractor → Normalizer → Safety Validator → Human Review → Published Knowledge DB
```

Regras mínimas para essa fase:

- Não copiar texto sem licença explícita.
- Não publicar automaticamente itens de alto risco.
- Não permitir dose explícita em conteúdo gerado para o usuário.
- Versionar e permitir rollback de toda publicação clínica.
