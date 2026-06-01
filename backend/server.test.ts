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

  it('GET /api/knowledge/stats expõe estatísticas da base clínica versionada', async () => {
    const app = createApp();
    const response = await request(app).get('/api/knowledge/stats');

    expect(response.status).toBe(200);
    expect(response.body.totalConditions).toBeGreaterThanOrEqual(3);
    expect(response.body.publishedConditions).toBeGreaterThanOrEqual(3);
    expect(response.body.byUrgency.emergencia).toBeGreaterThanOrEqual(1);
  });

  it('GET /api/knowledge/conditions permite buscar condições publicadas', async () => {
    const app = createApp();
    const response = await request(app).get('/api/knowledge/conditions').query({ q: 'sepse', limit: 5 });

    expect(response.status).toBe(200);
    expect(response.body.count).toBeGreaterThanOrEqual(1);
    expect(response.body.conditions[0].name).toContain('Sepse');
    expect(response.body.conditions[0].sourceCount).toBeGreaterThanOrEqual(1);
  });

  it('POST /api/clinical-analysis retorna 400 para payload inválido', async () => {
    const app = createApp();
    const response = await request(app).post('/api/clinical-analysis').send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Payload inválido.');
  });

  it('POST /api/clinical-analysis retorna fallback local funcional sem provedor IA', async () => {
    const app = createApp();
    const response = await request(app).post('/api/clinical-analysis').send({
      patientData: {
        name: 'Caso Simulado',
        age: 54,
        gender: 'Masculino',
        symptoms: 'Dor no peito e sudorese há 1 hora',
        duration: '6-24h',
      },
      localAssessment: {
        hypotheses: [
          {
            name: 'Síndrome Coronariana Aguda',
            probability: 'Alta',
            treatment: 'Conduta conforme protocolo institucional',
            explanation: 'Dor torácica típica com sinais autonômicos.',
            differentials: ['Pericardite'],
            recommendedExams: ['ECG'],
            redFlags: ['Dor torácica contínua'],
            score: 82,
          },
        ],
        triageLevel: 'Urgente',
        triageReason: 'Dor torácica de risco.',
        suggestedExams: ['ECG', 'Troponina'],
        immediateActions: ['Monitorização contínua'],
        clinicalSummary: 'Caso de risco cardiovascular em contexto educacional.',
        analysisSource: 'local',
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.analysisSource).toBe('local');
    expect(response.body.hypotheses?.length).toBeGreaterThan(0);
    expect(response.body.triageLevel).toBeTruthy();
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
