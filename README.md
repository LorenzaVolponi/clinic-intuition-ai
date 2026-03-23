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

### Variáveis de ambiente

```bash
VITE_GROQ_API_KEY=your_groq_key_here
VITE_GROQ_MODEL=llama-3.3-70b-versatile
```

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
