import { z } from 'zod';

export const clinicalSourceSchema = z.object({
  label: z.string().min(3),
  url: z.string().url(),
  license: z.string().min(3),
  retrievedAt: z.string().min(4),
});

export const clinicalConditionRecordSchema = z.object({
  id: z.string().min(3),
  name: z.string().min(3),
  icd10: z.string().optional(),
  icd11: z.string().optional(),
  category: z.string().min(2),
  commonSymptoms: z.array(z.string().min(2)).min(1),
  riskFactors: z.array(z.string()).default([]),
  ageGroups: z.array(z.string().min(3)).min(1),
  genderPreference: z.enum(['masculino', 'feminino', 'both']).optional(),
  urgencyLevel: z.enum(['baixa', 'moderada', 'alta', 'emergencia']),
  treatments: z.array(z.string().min(3)).min(1),
  differentials: z.array(z.string()).default([]),
  redFlags: z.array(z.string()).default([]),
  clinicalPearls: z.array(z.string()).default([]),
  recommendedExams: z.array(z.string()).default([]),
  durationProfile: z.array(z.enum(['hiperagudo', 'agudo', 'subagudo', 'cronico'])).optional(),
  sources: z.array(clinicalSourceSchema).min(1),
  review: z.object({
    status: z.enum(['draft', 'reviewed', 'published']),
    lastReviewedAt: z.string().min(4),
  }),
});

export const clinicalKnowledgePackSchema = z.object({
  version: z.string().min(1),
  updatedAt: z.string().min(4),
  sourcePolicy: z.string().min(10),
  conditions: z.array(clinicalConditionRecordSchema),
});

export type ClinicalConditionRecord = z.infer<typeof clinicalConditionRecordSchema>;
export type ClinicalKnowledgePack = z.infer<typeof clinicalKnowledgePackSchema>;
