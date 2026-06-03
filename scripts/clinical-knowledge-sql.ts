import {
  clinicalAssertionsBundleSchema,
  clinicalKnowledgeBundleSchema,
  clinicalSourcesBundleSchema,
  type ClinicalAssertion,
  type ClinicalKnowledgeCondition,
  type ClinicalSource,
} from '../src/lib/clinicalKnowledgeSchema';

export function escapeSqlLiteral(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return 'null';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function jsonbLiteral(value: unknown): string {
  if (value === undefined) return 'null';
  return `${escapeSqlLiteral(JSON.stringify(value))}::jsonb`;
}

function sourceInsert(source: ClinicalSource) {
  return `insert into clinical_sources (id, source_type, title, url, license, publisher, year, retrieved_at) values (${[
    escapeSqlLiteral(source.id),
    escapeSqlLiteral(source.sourceType),
    escapeSqlLiteral(source.title),
    escapeSqlLiteral(source.url),
    escapeSqlLiteral(source.license),
    escapeSqlLiteral(source.publisher),
    source.year,
    escapeSqlLiteral(source.retrievedAt),
  ].join(', ')}) on conflict (id) do update set source_type = excluded.source_type, title = excluded.title, url = excluded.url, license = excluded.license, publisher = excluded.publisher, year = excluded.year, retrieved_at = excluded.retrieved_at, updated_at = now();`;
}

function conditionInsert(condition: ClinicalKnowledgeCondition) {
  return `insert into clinical_conditions (id, name, icd10, icd11, category, urgency_level, summary, common_symptoms, risk_factors, age_groups, gender_preference, treatments, differentials, red_flags, clinical_pearls, recommended_exams, duration_profile, version, status, last_reviewed_at) values (${[
    escapeSqlLiteral(condition.id),
    escapeSqlLiteral(condition.name),
    escapeSqlLiteral(condition.icd10),
    escapeSqlLiteral(condition.icd11),
    escapeSqlLiteral(condition.category),
    escapeSqlLiteral(condition.urgencyLevel),
    escapeSqlLiteral(`${condition.name} (${condition.category})`),
    jsonbLiteral(condition.commonSymptoms),
    jsonbLiteral(condition.riskFactors),
    jsonbLiteral(condition.ageGroups),
    escapeSqlLiteral(condition.genderPreference),
    jsonbLiteral(condition.treatments),
    jsonbLiteral(condition.differentials),
    jsonbLiteral(condition.redFlags),
    jsonbLiteral(condition.clinicalPearls),
    jsonbLiteral(condition.recommendedExams),
    jsonbLiteral(condition.durationProfile),
    condition.version,
    escapeSqlLiteral(condition.status),
    escapeSqlLiteral(condition.lastReviewedAt),
  ].join(', ')}) on conflict (id) do update set name = excluded.name, icd10 = excluded.icd10, icd11 = excluded.icd11, category = excluded.category, urgency_level = excluded.urgency_level, summary = excluded.summary, common_symptoms = excluded.common_symptoms, risk_factors = excluded.risk_factors, age_groups = excluded.age_groups, gender_preference = excluded.gender_preference, treatments = excluded.treatments, differentials = excluded.differentials, red_flags = excluded.red_flags, clinical_pearls = excluded.clinical_pearls, recommended_exams = excluded.recommended_exams, duration_profile = excluded.duration_profile, version = excluded.version, status = excluded.status, last_reviewed_at = excluded.last_reviewed_at, updated_at = now();`;
}

function assertionInsert(assertion: ClinicalAssertion) {
  return `insert into clinical_assertions (id, subject, predicate, object, condition_id, source_id, confidence, evidence_level, review_status) values (${[
    escapeSqlLiteral(assertion.id),
    escapeSqlLiteral(assertion.subject),
    escapeSqlLiteral(assertion.predicate),
    escapeSqlLiteral(assertion.object),
    escapeSqlLiteral(assertion.conditionId),
    escapeSqlLiteral(assertion.sourceId),
    assertion.confidence,
    escapeSqlLiteral(assertion.evidenceLevel),
    escapeSqlLiteral(assertion.reviewStatus),
  ].join(', ')}) on conflict (id) do update set subject = excluded.subject, predicate = excluded.predicate, object = excluded.object, condition_id = excluded.condition_id, source_id = excluded.source_id, confidence = excluded.confidence, evidence_level = excluded.evidence_level, review_status = excluded.review_status, updated_at = now();`;
}

export function buildClinicalKnowledgeSeedSql(
  conditionsBundle: unknown,
  sourcesBundle: unknown,
  assertionsBundle: unknown,
): string {
  const parsedConditions = clinicalKnowledgeBundleSchema.parse(conditionsBundle);
  const parsedSources = clinicalSourcesBundleSchema.parse(sourcesBundle);
  const parsedAssertions = clinicalAssertionsBundleSchema.parse(assertionsBundle);

  return [
    '-- Generated clinical knowledge seed. Review before applying to production.',
    'begin;',
    ...parsedSources.sources.map(sourceInsert),
    ...parsedConditions.conditions.map(conditionInsert),
    ...parsedAssertions.assertions.map(assertionInsert),
    'commit;',
    '',
  ].join('\n');
}
