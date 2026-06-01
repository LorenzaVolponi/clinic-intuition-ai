import { describe, expect, it } from 'vitest';
import { ClinicalKnowledgeRepository } from './clinicalKnowledgeRepository';

describe('ClinicalKnowledgeRepository', () => {
  it('carrega estatísticas do knowledge pack versionado', async () => {
    const repository = new ClinicalKnowledgeRepository();
    const stats = await repository.getStats();

    expect(stats.version).toBe('1.0.0');
    expect(stats.totalConditions).toBeGreaterThanOrEqual(3);
    expect(stats.byUrgency.emergencia).toBeGreaterThanOrEqual(1);
  });

  it('filtra condições por texto, categoria e urgência', async () => {
    const repository = new ClinicalKnowledgeRepository();
    const results = await repository.searchConditions({ q: 'beta-hcg', category: 'ginecologico', urgency: 'emergencia' });

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Gravidez Ectópica Suspeita');
    expect(results[0].recommendedExams).toContain('Beta-HCG');
  });
});
