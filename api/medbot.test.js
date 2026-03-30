import { describe, expect, it, beforeEach, afterAll, vi } from 'vitest';
import handler from './medbot.js';

function createResponseCollector() {
  const res = {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

describe('api/medbot handler', () => {
  const originalGroq = process.env.GROQ_API_KEY;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.GROQ_API_KEY;
  });

  it('retorna fallback local com fontes clínicas e estado de sessão incremental', async () => {
    const sessionId = 'session-test-medbot-1';
    const req1 = {
      method: 'POST',
      headers: { 'x-session-uuid': sessionId },
      body: { topicId: 'cardiologia', question: 'quero revisar dor torácica' },
    };
    const res1 = createResponseCollector();
    await handler(req1, res1);

    expect(res1.statusCode).toBe(200);
    expect(res1.body.source).toBe('local');
    expect(res1.body.response.content.metadata.sources.some((item) => item.includes('ahajournals.org'))).toBe(true);
    expect(res1.body.response.session_state.total_interactions).toBe(1);

    const req2 = {
      method: 'POST',
      headers: { 'x-session-uuid': sessionId },
      body: { topicId: 'cardiologia', question: 'continua com red flags' },
    };
    const res2 = createResponseCollector();
    await handler(req2, res2);

    expect(res2.statusCode).toBe(200);
    expect(res2.body.source).toBe('local');
    expect(res2.body.response.session_state.total_interactions).toBe(2);
  });

  it('rejeita método diferente de POST', async () => {
    const req = { method: 'GET', headers: {}, body: {} };
    const res = createResponseCollector();
    await handler(req, res);

    expect(res.statusCode).toBe(405);
    expect(res.body.error).toBe('Method not allowed');
  });

  it('rejeita payload inválido sem topicId/question', async () => {
    const req = { method: 'POST', headers: {}, body: { topicId: '', question: '' } };
    const res = createResponseCollector();
    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Payload inválido.');
  });

  it('mantém fluxo natural da conversa quando usuário pede continuação', async () => {
    const req = {
      method: 'POST',
      headers: { 'x-session-uuid': 'session-natural-flow-1' },
      body: {
        topicId: 'cardiologia',
        question: 'continua',
        history: [
          { role: 'assistant', content: '📝 **QUIZ RELÂMPAGO - CARDIOLOGIA**\n\nPergunta 1/1...' },
          { role: 'user', content: 'manda mais' },
        ],
      },
    };
    const res = createResponseCollector();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.source).toBe('local');
    expect(res.body.intent).toBe('quiz');
    expect(res.body.answer).toContain('QUIZ RELÂMPAGO');
  });

  it('muda de formato naturalmente quando usuário pede "agora caso"', async () => {
    const req = {
      method: 'POST',
      headers: { 'x-session-uuid': 'session-natural-flow-2' },
      body: {
        topicId: 'cardiologia',
        question: 'agora caso clínico',
        history: [{ role: 'assistant', content: 'Resumo enviado.' }],
      },
    };
    const res = createResponseCollector();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.intent).toBe('caso');
    expect(res.body.answer).toContain('CASO CLÍNICO');
  });

  it('responde de forma curta quando pessoa pedir objetividade', async () => {
    const req = {
      method: 'POST',
      headers: { 'x-session-uuid': 'session-natural-flow-3' },
      body: {
        topicId: 'infectologia',
        question: 'resumo curto, sem enrolação',
      },
    };
    const res = createResponseCollector();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.source).toBe('local');
    expect(res.body.answer).toContain('versão curta');
  });

  it('adota tom de preceptor quando pessoa pedir mentoria', async () => {
    const req = {
      method: 'POST',
      headers: { 'x-session-uuid': 'session-natural-flow-4' },
      body: {
        topicId: 'emergencias',
        question: 'me guia como preceptor em emergência',
      },
    };
    const res = createResponseCollector();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.answer).toContain('agir como preceptor');
    expect(res.body.answer).toContain('Vamos por etapas');
  });

  it('mantém estilo curto na continuação quando já estava nesse formato', async () => {
    const req = {
      method: 'POST',
      headers: { 'x-session-uuid': 'session-natural-flow-5' },
      body: {
        topicId: 'infectologia',
        question: 'continua',
        history: [
          { role: 'assistant', content: 'Fechado — versão curta em infectologia: 1) ... 2) ... 3) ...' },
          { role: 'user', content: 'continua' },
        ],
      },
    };
    const res = createResponseCollector();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.answer).toContain('versão curta');
  });

  afterAll(() => {
    if (originalGroq) process.env.GROQ_API_KEY = originalGroq;
    else delete process.env.GROQ_API_KEY;
  });
});
