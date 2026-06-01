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


  it('GET /api/evidence/status expõe agente de evidências educacional', async () => {
    const app = createApp();
    const response = await request(app).get('/api/evidence/status');

    expect(response.status).toBe(200);
    expect(response.body.records).toBeGreaterThan(10_000);
    expect(response.body.sources).toBeGreaterThan(0);
    expect(response.body.massiveSeedRecords).toBeGreaterThan(10_000);
    expect(response.body.internalMode).toBe(true);
    expect(response.body.internalContexts).toBeGreaterThan(10);
    expect(response.body.safety).toContain('educacional');
  });


  it('GET /api/evidence/catalog entrega mapa interno offline da base', async () => {
    const app = createApp();
    const response = await request(app).get('/api/evidence/catalog');

    expect(response.status).toBe(200);
    expect(response.body.offlineReady).toBe(true);
    expect(response.body.totalGeneratedRecords).toBeGreaterThan(10_000);
    expect(response.body.domains.length).toBeGreaterThan(10);
    expect(response.body.contexts.length).toBeGreaterThan(10);
    expect(response.body.dimensions.length).toBeGreaterThan(5);
    expect(response.body.safety).toContain('simulação');
  });

  it('GET /api/evidence/search retorna resultados por tema', async () => {
    const app = createApp();
    const response = await request(app)
      .get('/api/evidence/search')
      .query({ q: 'dor torácica ECG', topic: 'cardiologia', domain: 'cardiologia', context: 'emergência', dimension: 'red-flags' });

    expect(response.status).toBe(200);
    expect(response.body.count).toBeGreaterThan(0);
    expect(response.body.results[0].title).toBeTruthy();
    expect(response.body.domain).toBe('cardiologia');
    expect(response.body.context).toBe('emergência');
    expect(response.body.educationalWarning).toContain('educacional');
  });


  it('GET /api/evidence/brief sintetiza evidências internas acionáveis', async () => {
    const app = createApp();
    const response = await request(app)
      .get('/api/evidence/brief')
      .query({ q: 'dispneia febre hipoxemia', domain: 'respiratorio', context: 'teletriagem', dimension: 'triage' });

    expect(response.status).toBe(200);
    expect(response.body.evidenceCount).toBeGreaterThan(0);
    expect(response.body.sections.length).toBeGreaterThan(2);
    expect(response.body.topRecords.length).toBeGreaterThan(0);
    expect(response.body.safety).toContain('simulação');
  });

  it('POST /api/evidence/refresh respeita flag de atualização remota', async () => {
    const app = createApp();
    const response = await request(app).post('/api/evidence/refresh').send({});

    expect(response.status).toBe(200);
    expect(response.body.refreshed).toBe(false);
    expect(response.body.reason).toContain('EVIDENCE_AGENT_ALLOW_REMOTE');
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
