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
    {
      name: 'Pericardite aguda',
      role: 'mais grave a excluir',
      probability: 'Média',
      confidenceScore: 60,
      justification: 'Dor torácica também pode ter causa inflamatória cardíaca.',
      physiopathology: 'Inflamação pericárdica pode simular dor isquêmica.',
      exams: ['ECG', 'PCR'],
      differentials: ['SCA'],
    },
    {
      name: 'Dor musculoesquelética torácica',
      role: 'diferencial comum',
      probability: 'Baixa',
      confidenceScore: 35,
      justification: 'Pode ocorrer dor torácica benigna, porém menos provável no cenário atual.',
      physiopathology: 'Dor parietal sem sinais de instabilidade sistêmica.',
      exams: ['Exame físico dirigido'],
      differentials: ['SCA'],
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

  it('reprova resposta sem as 3 probabilidades obrigatórias (Alta/Média/Baixa)', () => {
    const missingLevel = {
      ...validResponse,
      hypotheses: validResponse.hypotheses.map((item) => ({ ...item, probability: 'Média' as const })),
    };

    const result = validateClinicalResponse({ patientData: basePatient, response: missingLevel });
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('Nível de probabilidade ausente na resposta');
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

  it('reprova linguagem de diagnóstico definitivo', () => {
    const definitiveLanguage = {
      ...validResponse,
      hypotheses: [
        {
          ...validResponse.hypotheses[0],
          justification: 'Diagnóstico definitivo de infarto com certeza diagnóstica absoluta.',
        },
      ],
    };

    const result = validateClinicalResponse({ patientData: basePatient, response: definitiveLanguage });
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('diagnóstico definitivo');
  });

  it('reprova hipótese sem justificativa mínima', () => {
    const withoutJustification = {
      ...validResponse,
      hypotheses: [
        {
          ...validResponse.hypotheses[0],
          justification: 'curto',
        },
      ],
    };

    const result = validateClinicalResponse({ patientData: basePatient, response: withoutJustification });
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('Justificativa insuficiente na hipótese');
  });

  it('reprova dose/posologia explícita no texto clínico', () => {
    const withDose = {
      ...validResponse,
      conduct: {
        ...validResponse.conduct,
        immediateActions: ['Prescrever 500mg de medicação X a cada 8h'],
      },
    };

    const result = validateClinicalResponse({ patientData: basePatient, response: withDose });
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('Dose/posologia explícita não permitida');
  });

  it('reprova quando medicação citada no caso não aparece na justificativa/plano', () => {
    const patientWithMedication = {
      age: 30,
      gender: 'Feminino',
      symptoms: 'Crises de enxaqueca com aura visual e palpitações; usou ceffalium e dipirona.',
    };

    const responseWithoutMedicationTrace = {
      ...validResponse,
      triageReason: 'Cefaleia com sintomas neurológicos associados.',
      hypotheses: [
        {
          ...validResponse.hypotheses[0],
          name: 'Enxaqueca com aura',
          justification: 'Cefaleia pulsátil com fenômeno visual.',
        },
      ],
      investigationPlan: {
        immediate: ['Exame neurológico'],
        complementary: ['Avaliar gatilhos clínicos'],
        specialAttention: ['Reavaliação se piora'],
      },
      conduct: {
        immediateActions: ['Hidratação e observação'],
        monitoring: ['Monitorar intensidade da dor'],
        legalNotice: 'Conteúdo educacional: validar conduta com preceptor e protocolo local.',
      },
    };

    const result = validateClinicalResponse({ patientData: patientWithMedication, response: responseWithoutMedicationTrace });
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('Medicação citada no caso não foi considerada');
  });

  it('reprova quando ação relatada no caso não aparece na resposta', () => {
    const patientWithAction = {
      age: 31,
      gender: 'Feminino',
      symptoms: 'Cefaleia com aura e palpitações; recebeu soro na veia.',
    };

    const responseWithoutActionTrace = {
      ...validResponse,
      triageReason: 'Cefaleia com sintomas associados.',
      hypotheses: [
        {
          ...validResponse.hypotheses[0],
          name: 'Enxaqueca com aura',
          probability: 'Alta' as const,
          justification: 'Cefaleia pulsátil com fenômeno visual.',
        },
        {
          ...validResponse.hypotheses[1],
          probability: 'Média' as const,
        },
        {
          ...validResponse.hypotheses[2],
          probability: 'Baixa' as const,
        },
      ],
      conduct: {
        immediateActions: ['Observação e analgesia sem dose'],
        monitoring: ['Reavaliar sinais vitais'],
        legalNotice: 'Conteúdo educacional: validar conduta com preceptor e protocolo local.',
      },
    };

    const result = validateClinicalResponse({ patientData: patientWithAction, response: responseWithoutActionTrace });
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('Ação relatada no caso não foi considerada');
  });
});
