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

  afterAll(() => {
    if (originalGroq) process.env.GROQ_API_KEY = originalGroq;
    else delete process.env.GROQ_API_KEY;
  });
});
