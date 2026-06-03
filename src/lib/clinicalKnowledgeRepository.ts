import assertionsBundle from '../../data/clinical-knowledge/assertions.v1.json';
import sourcesBundle from '../../data/clinical-knowledge/sources.v1.json';
import {
  clinicalAssertionsBundleSchema,
  clinicalSourcesBundleSchema,
  type ClinicalAssertion,
  type ClinicalSource,
} from './clinicalKnowledgeSchema';
import type { MedicalCondition } from './medicalKnowledge';

export interface StructuredClinicalQuery {
  symptoms?: string[];
  predicate?: ClinicalAssertion['predicate'];
  conditionId?: string;
  minConfidence?: number;
}

export interface StructuredClinicalSearchResult {
  conditions: MedicalCondition[];
  assertions: ClinicalAssertion[];
  sources: ClinicalSource[];
}

const normalizeText = (value: string) => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

function includesClinicalTerm(haystack: string, needle: string) {
  const normalizedHaystack = normalizeText(haystack);
  const normalizedNeedle = normalizeText(needle);
  return normalizedHaystack.includes(normalizedNeedle) || normalizedNeedle.includes(normalizedHaystack);
}

export function getPublishedClinicalAssertions(rawBundle: unknown = assertionsBundle): ClinicalAssertion[] {
  const parsed = clinicalAssertionsBundleSchema.safeParse(rawBundle);
  if (!parsed.success) return [];

  return parsed.data.assertions.filter((assertion) => assertion.reviewStatus === 'published' || assertion.reviewStatus === 'reviewed');
}

export function getClinicalSources(rawBundle: unknown = sourcesBundle): ClinicalSource[] {
  const parsed = clinicalSourcesBundleSchema.safeParse(rawBundle);
  if (!parsed.success) return [];

  return parsed.data.sources;
}

export function searchStructuredClinicalKnowledge(
  query: StructuredClinicalQuery,
  availableConditions: MedicalCondition[] = [],
): StructuredClinicalSearchResult {
  const minConfidence = query.minConfidence ?? 0;
  const symptoms = (query.symptoms || []).filter(Boolean);
  const publishedAssertions = getPublishedClinicalAssertions();
  const symptomSupportedConditionIds = new Set(
    publishedAssertions
      .filter((assertion) => assertion.predicate === 'supports_condition')
      .filter((assertion) => symptoms.some((symptom) => includesClinicalTerm(assertion.subject, symptom)))
      .map((assertion) => assertion.conditionId)
      .filter(Boolean),
  );

  const assertions = publishedAssertions.filter((assertion) => {
    if (assertion.confidence < minConfidence) return false;
    if (query.predicate && assertion.predicate !== query.predicate) return false;
    if (query.conditionId && assertion.conditionId !== query.conditionId) return false;

    if (symptoms.length > 0) {
      return symptoms.some((symptom) => includesClinicalTerm(assertion.subject, symptom) || includesClinicalTerm(assertion.object, symptom))
        || Boolean(assertion.conditionId && symptomSupportedConditionIds.has(assertion.conditionId));
    }

    return true;
  });

  const conditionIds = new Set(assertions.map((assertion) => assertion.conditionId).filter(Boolean));
  const sourceIds = new Set(assertions.map((assertion) => assertion.sourceId));

  return {
    conditions: availableConditions.filter((condition) => condition.id && conditionIds.has(condition.id)),
    assertions,
    sources: getClinicalSources().filter((source) => sourceIds.has(source.id)),
  };
}

export function getRequiredExamsForSymptoms(symptoms: string[], minConfidence = 0.8): string[] {
  const result = searchStructuredClinicalKnowledge({
    symptoms,
    predicate: 'requires_exam',
    minConfidence,
  });

  return [...new Set(result.assertions.map((assertion) => assertion.object))];
}
