import { describe, expect, it } from 'vitest';
import { validateClinicalResponse } from './validators';

const basePatient = {
  age: 42,
  gender: 'Masculino',
  symptoms: 'Dor no peito súbita há 30 minutos com sudorese',
};

const validResponse = {
  triageLevel: 'Urgência',
  triageReason: 'Dor torácica típica com risco cardiovascular.',
  educationalWarning: 'Conteúdo educacional.',
  hypotheses: [
    {
      name: 'Síndrome coronariana aguda',
      role: 'mais provável',
      probability: 'Alta',
      confidenceScore: 88,
      justification: 'Dor torácica típica associada a sudorese.',
      physiopathology: 'Ruptura de placa e trombose coronária.',
      exams: ['ECG', 'Troponina'],
      differentials: ['Dissecção de aorta'],
    },
  ],
  investigationPlan: {
    immediate: ['ECG', 'Troponina'],
    complementary: ['Raio-X de tórax'],
    specialAttention: ['Monitorização contínua'],
  },
  conduct: {
    immediateActions: ['Oxigênio se necessário'],
    monitoring: ['Monitor cardíaco'],
    legalNotice: 'Buscar avaliação presencial.',
  },
};

describe('validateClinicalResponse', () => {
  it('aprova resposta clínica segura', () => {
    const result = validateClinicalResponse({ patientData: basePatient, response: validResponse });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('reprova dor torácica sem ECG no plano', () => {
    const responseWithoutEcg = {
      ...validResponse,
      investigationPlan: {
        ...validResponse.investigationPlan,
        immediate: ['Troponina'],
      },
    };

    const result = validateClinicalResponse({ patientData: basePatient, response: responseWithoutEcg });
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('Dor torácica sem ECG');
  });
});
