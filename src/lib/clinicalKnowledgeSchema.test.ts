import { describe, expect, it } from 'vitest';
import { CLINICAL_KNOWLEDGE_FALLBACK_CONDITIONS, MEDICAL_CONDITIONS } from './medicalKnowledge';
import { loadClinicalKnowledgeFromJson } from './clinicalKnowledgeSchema';

describe('clinical knowledge loader', () => {
  it('carrega condições publicadas a partir do JSON versionado', () => {
    expect(MEDICAL_CONDITIONS.length).toBeGreaterThan(0);
    expect(MEDICAL_CONDITIONS[0]).toMatchObject({
      id: expect.any(String),
      version: expect.any(Number),
      status: expect.stringMatching(/published|reviewed/),
      lastReviewedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    });
  });

  it('preserva fallback TypeScript quando o bundle JSON é inválido', () => {
    const result = loadClinicalKnowledgeFromJson({ conditions: [] }, CLINICAL_KNOWLEDGE_FALLBACK_CONDITIONS);

    expect(result.source).toBe('fallback');
    expect(result.conditions).toBe(CLINICAL_KNOWLEDGE_FALLBACK_CONDITIONS);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('não publica itens em draft/deprecated no carregamento ativo', () => {
    const result = loadClinicalKnowledgeFromJson(
      {
        version: 'test',
        status: 'reviewed',
        generatedAt: '2026-06-01',
        conditions: [
          {
            id: 'cond-draft',
            name: 'Condição Draft',
            category: 'teste',
            commonSymptoms: ['sintoma'],
            urgencyLevel: 'baixa',
            treatments: ['conduta educacional'],
            version: 1,
            status: 'draft',
            lastReviewedAt: '2026-06-01',
          },
          {
            id: 'cond-reviewed',
            name: 'Condição Revisada',
            category: 'teste',
            commonSymptoms: ['sintoma'],
            urgencyLevel: 'baixa',
            treatments: ['conduta educacional'],
            version: 1,
            status: 'reviewed',
            lastReviewedAt: '2026-06-01',
          },
        ],
      },
      CLINICAL_KNOWLEDGE_FALLBACK_CONDITIONS,
    );

    expect(result.source).toBe('json');
    expect(result.conditions).toHaveLength(1);
    expect(result.conditions[0].name).toBe('Condição Revisada');
  });
});
