import { describe, expect, it } from 'vitest';
import { getClinicalSources, getPublishedClinicalAssertions, getRequiredExamsForSymptoms, searchStructuredClinicalKnowledge } from './clinicalKnowledgeRepository';
import { MEDICAL_CONDITIONS } from './medicalKnowledge';

describe('clinical knowledge repository', () => {
  it('expõe assertions publicadas como fatos estruturados', () => {
    const assertions = getPublishedClinicalAssertions();

    expect(assertions.length).toBeGreaterThan(0);
    expect(assertions[0]).toMatchObject({
      subject: expect.any(String),
      predicate: expect.any(String),
      object: expect.any(String),
      sourceId: expect.any(String),
    });
  });

  it('busca exames obrigatórios de dor torácica sem depender de texto longo', () => {
    const exams = getRequiredExamsForSymptoms(['dor no peito']);

    expect(exams).toContain('ECG');
    expect(exams).toContain('Troponina seriada');
  });

  it('retorna fontes rastreáveis para fatos encontrados', () => {
    const result = searchStructuredClinicalKnowledge({ symptoms: ['dor torácica'], predicate: 'requires_exam' }, MEDICAL_CONDITIONS);

    expect(result.assertions.length).toBeGreaterThan(0);
    expect(result.conditions.some((condition) => condition.name === 'Síndrome Coronariana Aguda')).toBe(true);
    expect(result.sources.some((source) => source.id === 'local-safe-core-v1')).toBe(true);
  });

  it('não publica assertions em draft/deprecated', () => {
    const assertions = getPublishedClinicalAssertions({
      version: 'test',
      status: 'published',
      generatedAt: '2026-06-03',
      assertions: [
        {
          id: 'draft-assertion',
          subject: 'x',
          predicate: 'requires_exam',
          object: 'y',
          sourceId: 'local-safe-core-v1',
          confidence: 1,
          evidenceLevel: 'local_core',
          reviewStatus: 'draft',
        },
        {
          id: 'published-assertion',
          subject: 'dor torácica',
          predicate: 'requires_exam',
          object: 'ECG',
          sourceId: 'local-safe-core-v1',
          confidence: 1,
          evidenceLevel: 'local_core',
          reviewStatus: 'published',
        },
      ],
    });

    expect(assertions).toHaveLength(1);
    expect(assertions[0].id).toBe('published-assertion');
  });

  it('valida catálogo de fontes disponível para auditoria local', () => {
    expect(getClinicalSources().map((source) => source.id)).toContain('local-safe-core-v1');
  });
});
