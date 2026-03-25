import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from './server';

describe('backend server routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/health responde status ok', async () => {
    const app = createApp();
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.headers['x-request-id']).toBeTruthy();
  });

  it('POST /api/clinical-analysis retorna 400 para payload inválido', async () => {
    const app = createApp();
    const response = await request(app).post('/api/clinical-analysis').send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Payload inválido.');
  });

  it('POST /api/study-pack gera pacote com 10 aulas e 10 perguntas', async () => {
    const app = createApp();
    const response = await request(app).post('/api/study-pack').send({ topicId: 'cardiologia' });

    expect(response.status).toBe(200);
    expect(response.body.lessons).toHaveLength(10);
    expect(response.body.quiz).toHaveLength(10);
    expect(response.body.flashcards).toHaveLength(10);
  });

  it('POST /api/study-pack aceita objetivo/foco/nonce e reflete objetivo nas aulas locais', async () => {
    const app = createApp();
    const response = await request(app).post('/api/study-pack').send({
      topicId: 'infectologia',
      objective: 'foco em sepse no pronto atendimento',
      focus: 'lessons',
      nonce: 'abc123',
    });

    expect(response.status).toBe(200);
    expect(response.body.lessons).toHaveLength(10);
    expect(response.body.lessons[0].content).toContain('foco em sepse no pronto atendimento');
    expect(response.body.lessons[0].title).toContain('abc123');
  });

  it('POST /api/medbot sem provedor retorna fallback local', async () => {
    const app = createApp();
    const response = await request(app).post('/api/medbot').send({ topicId: 'cardiologia', question: 'como estudar?' });

    expect(response.status).toBe(200);
    expect(response.body.source).toBe('local');
    expect(typeof response.body.answer).toBe('string');
  });

  it('POST /api/medbot em pedido de ajuda responde de forma direta ao tema solicitado', async () => {
    const app = createApp();
    const response = await request(app)
      .post('/api/medbot')
      .send({ topicId: 'farmacologia', question: 'quero ajuda pra entender sobre entorpecentes' });

    expect(response.status).toBe(200);
    expect(response.body.source).toBe('local');
    expect(response.body.answer).toContain('entorpecentes');
    expect(response.body.answer).not.toContain('No momento, consigo');
  });
});
