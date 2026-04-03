import request from 'supertest';
import { describe, expect, it, vi, beforeEach } from 'vitest';
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

  it('GET /api/metrics expõe contadores básicos', async () => {
    const app = createApp();
    const response = await request(app).get('/api/metrics');

    expect(response.status).toBe(200);
    expect(typeof response.body.requestCount).toBe('number');
    expect(response.body.fallbackUsage).toBeTruthy();
    expect(typeof response.body.sessionCacheSize).toBe('number');
  });

  it('POST /api/clinical-analysis retorna 400 para payload inválido', async () => {
    const app = createApp();
    const response = await request(app).post('/api/clinical-analysis').send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Payload inválido.');
  });

  it('POST /api/medbot retorna endpoint desativado', async () => {
    const app = createApp();
    const response = await request(app).post('/api/medbot').send({ topicId: 'cardiologia', question: 'oi' });

    expect(response.status).toBe(410);
    expect(response.body.error).toContain('desativado');
  });

  it('POST /api/study-pack retorna endpoint desativado', async () => {
    const app = createApp();
    const response = await request(app).post('/api/study-pack').send({ topicId: 'cardiologia' });

    expect(response.status).toBe(410);
    expect(response.body.error).toContain('desativado');
  });
});
