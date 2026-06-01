import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { clinicalKnowledgePackSchema, type ClinicalConditionRecord, type ClinicalKnowledgePack } from '../../src/lib/clinicalKnowledgeSchema';

export interface KnowledgeConditionSummary {
  id: string;
  name: string;
  icd10?: string;
  icd11?: string;
  category: string;
  urgencyLevel: ClinicalConditionRecord['urgencyLevel'];
  commonSymptoms: string[];
  redFlags: string[];
  recommendedExams: string[];
  sourceCount: number;
  reviewStatus: ClinicalConditionRecord['review']['status'];
  lastReviewedAt: string;
}

export interface KnowledgeSearchParams {
  q?: string;
  category?: string;
  urgency?: ClinicalConditionRecord['urgencyLevel'];
  limit?: number;
  includeDrafts?: boolean;
}

export interface KnowledgeStats {
  version: string;
  updatedAt: string;
  sourcePolicy: string;
  totalConditions: number;
  publishedConditions: number;
  draftConditions: number;
  reviewedConditions: number;
  byCategory: Record<string, number>;
  byUrgency: Record<string, number>;
}

const DEFAULT_KNOWLEDGE_PATH = 'data/clinical-knowledge/conditions.v1.json';
const MAX_LIMIT = 100;

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function toSummary(condition: ClinicalConditionRecord): KnowledgeConditionSummary {
  return {
    id: condition.id,
    name: condition.name,
    icd10: condition.icd10,
    icd11: condition.icd11,
    category: condition.category,
    urgencyLevel: condition.urgencyLevel,
    commonSymptoms: condition.commonSymptoms,
    redFlags: condition.redFlags,
    recommendedExams: condition.recommendedExams,
    sourceCount: condition.sources.length,
    reviewStatus: condition.review.status,
    lastReviewedAt: condition.review.lastReviewedAt,
  };
}

export class ClinicalKnowledgeRepository {
  private cache?: ClinicalKnowledgePack;

  constructor(private readonly knowledgePath = resolve(process.cwd(), DEFAULT_KNOWLEDGE_PATH)) {}

  async loadKnowledgePack() {
    if (this.cache) return this.cache;

    const raw = await readFile(this.knowledgePath, 'utf-8');
    const parsed = clinicalKnowledgePackSchema.parse(JSON.parse(raw));
    this.cache = parsed;
    return parsed;
  }

  async searchConditions(params: KnowledgeSearchParams = {}) {
    const pack = await this.loadKnowledgePack();
    const query = normalizeText(params.q || '');
    const category = normalizeText(params.category || '');
    const limit = Math.max(1, Math.min(params.limit || 25, MAX_LIMIT));

    return pack.conditions
      .filter((condition) => params.includeDrafts || condition.review.status === 'published')
      .filter((condition) => !params.urgency || condition.urgencyLevel === params.urgency)
      .filter((condition) => !category || normalizeText(condition.category) === category)
      .filter((condition) => {
        if (!query) return true;
        const searchable = normalizeText([
          condition.name,
          condition.icd10 || '',
          condition.icd11 || '',
          condition.category,
          ...condition.commonSymptoms,
          ...condition.redFlags,
          ...condition.recommendedExams,
          ...condition.differentials,
        ].join(' '));
        return searchable.includes(query);
      })
      .slice(0, limit)
      .map(toSummary);
  }

  async getStats(): Promise<KnowledgeStats> {
    const pack = await this.loadKnowledgePack();
    const byCategory: Record<string, number> = {};
    const byUrgency: Record<string, number> = {};

    for (const condition of pack.conditions) {
      byCategory[condition.category] = (byCategory[condition.category] || 0) + 1;
      byUrgency[condition.urgencyLevel] = (byUrgency[condition.urgencyLevel] || 0) + 1;
    }

    return {
      version: pack.version,
      updatedAt: pack.updatedAt,
      sourcePolicy: pack.sourcePolicy,
      totalConditions: pack.conditions.length,
      publishedConditions: pack.conditions.filter((condition) => condition.review.status === 'published').length,
      draftConditions: pack.conditions.filter((condition) => condition.review.status === 'draft').length,
      reviewedConditions: pack.conditions.filter((condition) => condition.review.status === 'reviewed').length,
      byCategory,
      byUrgency,
    };
  }
}

export const clinicalKnowledgeRepository = new ClinicalKnowledgeRepository();
