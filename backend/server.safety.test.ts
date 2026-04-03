import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

const originalGroqKey = process.env.GROQ_API_KEY;

const clinicalPayload = {
  patientData: {
    name: 'Paciente Teste',
    age: 56,
    gender: 'Masculino',
    symptoms: 'Dor no peito com sudorese há 30 minutos',
    duration: '< 6h',
  },
  localAssessment: {
    hypotheses: [
      {
        name: 'Síndrome Coronariana Aguda',
        probability: 'Alta',
        treatment: 'Conduta conforme protocolo institucional',
        explanation: 'Compatível com dor torácica de risco.',
        differentials: ['Dissecção aórtica'],
        recommendedExams: ['ECG', 'Troponina'],
        redFlags: ['Dor torácica súbita'],
        score: 80,
      },
    ],
    triageLevel: 'Urgente',
    triageReason: 'Dor torácica com sinais autonômicos.',
    suggestedExams: ['ECG', 'Troponina'],
    immediateActions: ['Monitorização contínua'],
    clinicalSummary: 'Fallback local seguro para dor torácica.',
    analysisSource: 'local',
  },
};

describe('server clinical safety fallback', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.resetModules();
    if (originalGroqKey) process.env.GROQ_API_KEY = originalGroqKey;
    else delete process.env.GROQ_API_KEY;
  });

  it('força fallback local com validationWarnings quando IA viola regra crítica (dor torácica sem ECG)', async () => {
    process.env.GROQ_API_KEY = 'fake-key';

    const modelPayload = {
      triageLevel: 'Urgência',
      triageReason: 'Dor torácica em investigação.',
      educationalWarning: 'Saída educacional.',
      hypotheses: [
        {
          name: 'Síndrome coronariana aguda',
          role: 'mais provável',
          probability: 'Alta',
          confidenceScore: 88,
          justification: 'Dor torácica e sudorese.',
          physiopathology: 'Isquemia miocárdica.',
          exams: ['Troponina'],
          differentials: ['DRGE'],
        },
      ],
      investigationPlan: {
        immediate: ['Troponina'],
        complementary: ['Raio-X de tórax'],
        specialAttention: ['Observação'],
      },
      conduct: {
        immediateActions: ['Monitorização clínica'],
        monitoring: ['Reavaliação seriada'],
        legalNotice: 'Conteúdo educacional.',
      },
    };

    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify(modelPayload),
                },
              },
            ],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ),
    );

    const { createApp } = await import('./server');
    const app = createApp();

    const response = await request(app).post('/api/clinical-analysis').send(clinicalPayload);

    expect(response.status).toBe(200);
    expect(response.body.analysisSource).toBe('local');
    expect(Array.isArray(response.body.validationWarnings)).toBe(true);
    expect(response.body.validationWarnings.join(' ')).toContain('Dor torácica sem ECG');
  });
});
