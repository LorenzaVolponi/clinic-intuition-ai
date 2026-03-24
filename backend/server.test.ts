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
});
