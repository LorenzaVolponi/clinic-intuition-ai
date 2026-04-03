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
    expect(chestPain.clinicalSummary).toContain('Base educacional');
    expect(urinary.clinicalSummary).toContain('Base educacional');
  });

  it('inclui referência rápida por hipótese para uso no layout diagnóstico', () => {
    const assessment = buildLocalAssessment({
      name: 'Paciente C',
      age: 61,
      gender: 'Masculino',
      duration: '< 6h',
      symptoms: 'Dor torácica, sudorese, náusea e dispneia',
    });

    expect(assessment.hypotheses[0]?.referenceLabel).toBeTruthy();
    expect(assessment.hypotheses[0]?.referenceUrl).toMatch(/^https?:\/\//);
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
});
