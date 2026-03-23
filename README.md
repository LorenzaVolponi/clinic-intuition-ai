# MedInnova AI Lab

Plataforma educacional em React + Vite para estudo médico com:

- simulador de casos clínicos com triagem inteligente;
- flashcards temáticos;
- quiz por área;
- MedBot para revisão guiada;
- timeline da evolução da medicina;
- sistema leve de conquistas para gamificar a sessão.

## Como rodar

```bash
npm install
cp .env.example .env
npm run dev
```

## Variáveis de ambiente

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
