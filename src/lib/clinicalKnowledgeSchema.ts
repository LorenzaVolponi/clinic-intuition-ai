import { z } from 'zod';

import clinicalConditionsJson from '../../data/clinical-knowledge/conditions.v1.json';
import type { MedicalCondition } from './medicalKnowledge';

const urgencyLevelSchema = z.enum(['baixa', 'moderada', 'alta', 'emergencia']);
const reviewStatusSchema = z.enum(['draft', 'reviewed', 'published', 'deprecated']);
const durationProfileSchema = z.enum(['hiperagudo', 'agudo', 'subagudo', 'cronico']);

export const clinicalConditionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  icd10: z.string().min(1).optional(),
  icd11: z.string().min(1).optional(),
  category: z.string().min(1),
  commonSymptoms: z.array(z.string().min(1)).min(1),
  riskFactors: z.array(z.string().min(1)).default([]),
  ageGroups: z.array(z.string().min(1)).default([]),
  genderPreference: z.enum(['masculino', 'feminino', 'both']).optional(),
  urgencyLevel: urgencyLevelSchema,
  treatments: z.array(z.string().min(1)).min(1),
  differentials: z.array(z.string().min(1)).default([]),
  redFlags: z.array(z.string().min(1)).default([]),
  clinicalPearls: z.array(z.string().min(1)).default([]),
  recommendedExams: z.array(z.string().min(1)).default([]),
  durationProfile: z.array(durationProfileSchema).optional(),
  version: z.number().int().positive(),
  status: reviewStatusSchema,
  lastReviewedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const clinicalKnowledgeBundleSchema = z.object({
  version: z.string().min(1),
  status: z.enum(['draft', 'reviewed', 'published']),
  generatedFrom: z.string().min(1).optional(),
  generatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  conditions: z.array(clinicalConditionSchema).min(1),
});

export type ClinicalKnowledgeCondition = z.infer<typeof clinicalConditionSchema>;
export type ClinicalKnowledgeBundle = z.infer<typeof clinicalKnowledgeBundleSchema>;

export interface ClinicalKnowledgeLoadResult {
  conditions: MedicalCondition[];
  source: 'json' | 'fallback';
  warnings: string[];
}

function toMedicalCondition(condition: ClinicalKnowledgeCondition): MedicalCondition {
  return {
    id: condition.id,
    name: condition.name,
    icd10: condition.icd10,
    icd11: condition.icd11,
    category: condition.category,
    commonSymptoms: condition.commonSymptoms,
    riskFactors: condition.riskFactors,
    ageGroups: condition.ageGroups,
    genderPreference: condition.genderPreference,
    urgencyLevel: condition.urgencyLevel,
    treatments: condition.treatments,
    differentials: condition.differentials,
    redFlags: condition.redFlags,
    clinicalPearls: condition.clinicalPearls,
    recommendedExams: condition.recommendedExams,
    durationProfile: condition.durationProfile,
    version: condition.version,
    status: condition.status,
    lastReviewedAt: condition.lastReviewedAt,
  };
}

export function loadClinicalKnowledgeFromJson(
  rawBundle: unknown,
  fallbackConditions: MedicalCondition[],
): ClinicalKnowledgeLoadResult {
  const parsed = clinicalKnowledgeBundleSchema.safeParse(rawBundle);

  if (!parsed.success) {
    return {
      conditions: fallbackConditions,
      source: 'fallback',
      warnings: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    };
  }

  const publishedConditions = parsed.data.conditions
    .filter((condition) => condition.status === 'published' || condition.status === 'reviewed')
    .map(toMedicalCondition);

  if (publishedConditions.length === 0) {
    return {
      conditions: fallbackConditions,
      source: 'fallback',
      warnings: ['Nenhuma condição publicada/revisada encontrada no JSON clínico.'],
    };
  }

  return {
    conditions: publishedConditions,
    source: 'json',
    warnings: [],
  };
}

export function loadPublishedMedicalConditions(fallbackConditions: MedicalCondition[]) {
  return loadClinicalKnowledgeFromJson(clinicalConditionsJson, fallbackConditions).conditions;
}
