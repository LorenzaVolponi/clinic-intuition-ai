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
    legalNotice: 'Conteúdo educacional: validar conduta com preceptor e protocolo local.',
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

  it('reprova mulher em idade fértil com dor+nausea sem beta-HCG', () => {
    const femalePatient = {
      age: 28,
      gender: 'Feminino',
      symptoms: 'Dor abdominal com náusea há 6 horas',
    };

    const responseWithoutBetaHcg = {
      ...validResponse,
      hypotheses: [
        {
          ...validResponse.hypotheses[0],
          name: 'Apendicite aguda',
          justification: 'Dor abdominal em fossa ilíaca com náusea.',
        },
      ],
      investigationPlan: {
        immediate: ['Hemograma'],
        complementary: ['USG de abdome'],
        specialAttention: ['Reavaliação clínica'],
      },
    };

    const result = validateClinicalResponse({ patientData: femalePatient, response: responseWithoutBetaHcg });
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('beta-HCG');
  });

  it('reprova hipótese primária desconexa dos sintomas (alucinação clínica)', () => {
    const nonAbdominalPatient = {
      age: 35,
      gender: 'Masculino',
      symptoms: 'Cefaleia tensional e dor cervical ao fim do dia',
    };

    const hallucinatedResponse = {
      ...validResponse,
      hypotheses: [
        {
          ...validResponse.hypotheses[0],
          name: 'Dor abdominal em fossa ilíaca',
          justification: 'Dor abdominal intensa em fossa ilíaca e irritação peritoneal.',
        },
      ],
    };

    const result = validateClinicalResponse({ patientData: nonAbdominalPatient, response: hallucinatedResponse });
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('Possível alucinação clínica');
  });

  it('reprova confidenceScore acima do limite de segurança', () => {
    const overconfident = {
      ...validResponse,
      hypotheses: [
        {
          ...validResponse.hypotheses[0],
          confidenceScore: 99,
        },
      ],
    };

    const result = validateClinicalResponse({ patientData: basePatient, response: overconfident });
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('ConfidenceScore excessivo');
  });

  it('reprova ausência de aviso legal/educacional adequado', () => {
    const withoutLegalNotice = {
      ...validResponse,
      conduct: {
        ...validResponse.conduct,
        legalNotice: 'seguir conduta',
      },
    };

    const result = validateClinicalResponse({ patientData: basePatient, response: withoutLegalNotice });
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('Aviso legal/educacional insuficiente');
  });

  it('reprova hipótese incompatível com sintomas explícitos', () => {
    const neurologicPatient = {
      age: 40,
      gender: 'Masculino',
      symptoms: 'Cefaleia leve há 1 dia, sem alterações neurológicas descritas',
    };

    const incompatibleResponse = {
      ...validResponse,
      hypotheses: [
        {
          ...validResponse.hypotheses[0],
          name: 'Acidente vascular cerebral isquêmico',
          justification: 'AVC agudo apesar de ausência de déficit focal informado.',
        },
      ],
    };

    const result = validateClinicalResponse({ patientData: neurologicPatient, response: incompatibleResponse });
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('Hipótese incompatível com sintomas explícitos');
  });
});
