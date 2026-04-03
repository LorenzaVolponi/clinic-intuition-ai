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
    expect(assessment.hypotheses[0]?.medicationOptions?.length).toBeGreaterThanOrEqual(2);
  });

  it('altera hipótese principal conforme caso clínico inserido', () => {
    const chestPain = buildLocalAssessment({
      name: 'Paciente A',
      age: 58,
      gender: 'Masculino',
      duration: '< 6h',
      symptoms: 'Dor torácica em aperto com sudorese e dispneia',
    });
    const urinary = buildLocalAssessment({
      name: 'Paciente B',
      age: 24,
      gender: 'Feminino',
      duration: '1-7d',
      symptoms: 'Disúria, polaciúria e dor suprapúbica sem febre alta',
    });

    expect(chestPain.hypotheses[0]?.name).not.toBe(urinary.hypotheses[0]?.name);
    expect(chestPain.clinicalSummary).toContain('Principais hipóteses locais');
    expect(urinary.clinicalSummary).toContain('Principais hipóteses locais');
  });

  it('mantém explicação breve sem links e com percentual coerente', () => {
    const assessment = buildLocalAssessment({
      name: 'Paciente C',
      age: 61,
      gender: 'Masculino',
      duration: '< 6h',
      symptoms: 'Dor torácica, sudorese, náusea e dispneia',
    });

    expect(assessment.hypotheses[0]?.explanation).not.toMatch(/https?:\/\//i);
    expect(assessment.hypotheses[0]?.probabilityPercent).toBeGreaterThanOrEqual(70);
    expect(assessment.hypotheses[0]?.probabilityPercent).toBeLessThanOrEqual(95);
  });

  it('evita classificar como emergência sintomas respiratórios leves sem red flags fortes', () => {
    const assessment = buildLocalAssessment({
      name: 'Paciente D',
      age: 25,
      gender: 'Masculino',
      duration: '1-7d',
      symptoms: 'Tosse seca, dor de garganta e catarro',
    });

    expect(assessment.triageLevel).not.toBe('Emergência');
  });

  it('não sugere hipóteses desconexas (asma/apendicite) em quadro típico de enxaqueca', () => {
    const assessment = buildLocalAssessment({
      name: 'Paciente E',
      age: 29,
      gender: 'Feminino',
      duration: '1-7d',
      symptoms: 'Crises fortes de enxaqueca ao redor da cabeça, aura visual e palpitações',
    });

    const hypothesisNames = assessment.hypotheses.map((item) => item.name.toLowerCase()).join(' | ');
    expect(hypothesisNames).not.toContain('asma');
    expect(hypothesisNames).not.toContain('apendicite');
  });

  it('sempre retorna estratificação completa Alta/Moderada/Baixa', () => {
    const assessment = buildLocalAssessment({
      name: 'Paciente F',
      age: 45,
      gender: 'Masculino',
      duration: '1-7d',
      symptoms: 'cefaleia intensa e fotofobia',
    });

    const probabilities = assessment.hypotheses.map((item) => item.probability);
    expect(probabilities).toEqual(['Alta', 'Moderada', 'Baixa']);
  });

  it('mantém percentuais em faixa alta/média/baixa na ordem correta', () => {
    const assessment = buildLocalAssessment({
      name: 'Paciente G',
      age: 37,
      gender: 'Feminino',
      duration: '1-7d',
      symptoms: 'cefaleia intensa, aura visual, fotofobia e náusea',
    });

    const [high, medium, low] = assessment.hypotheses;
    expect(high.probability).toBe('Alta');
    expect(medium.probability).toBe('Moderada');
    expect(low.probability).toBe('Baixa');

    expect(high.probabilityPercent).toBeGreaterThanOrEqual(70);
    expect(high.probabilityPercent).toBeLessThanOrEqual(95);
    expect(medium.probabilityPercent).toBeGreaterThanOrEqual(45);
    expect(medium.probabilityPercent).toBeLessThanOrEqual(69);
    expect(low.probabilityPercent).toBeGreaterThanOrEqual(20);
    expect(low.probabilityPercent).toBeLessThanOrEqual(44);
  });
});
