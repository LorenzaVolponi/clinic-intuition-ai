import { describe, expect, it } from 'vitest';
import { buildLocalAssessment } from './medicalKnowledge';

describe('buildLocalAssessment', () => {
  it('normaliza gênero e mantém alta suspeita cardiovascular para dor torácica', () => {
    const assessment = buildLocalAssessment({
      name: 'Paciente',
      age: 55,
      gender: 'Masculino',
      duration: '< 6h',
      symptoms: 'Dor torácica súbita com sudorese profusa e náusea',
    });

    expect(assessment.hypotheses[0]?.name).toBe('Síndrome Coronariana Aguda');
    expect(assessment.hypotheses[0]?.score).toBeGreaterThanOrEqual(70);
  });

  it('evita doses explícitas na recomendação de tratamento local', () => {
    const assessment = buildLocalAssessment({
      name: 'Paciente',
      age: 65,
      gender: 'Masculino',
      duration: '< 6h',
      symptoms: 'Dor torácica com sudorese e falta de ar',
    });

    expect(assessment.hypotheses[0]?.treatment).toContain('sem dose neste simulador');
    expect(assessment.hypotheses[0]?.treatment).not.toMatch(/\b\d+\s?(mg|g|ml|\/\d+h|\/dia)\b/i);
  });
});
