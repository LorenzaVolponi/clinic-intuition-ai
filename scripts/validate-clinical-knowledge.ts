import assertionsBundle from '../data/clinical-knowledge/assertions.v1.json';
import conditionsBundle from '../data/clinical-knowledge/conditions.v1.json';
import sourcesBundle from '../data/clinical-knowledge/sources.v1.json';
import {
  clinicalAssertionsBundleSchema,
  clinicalKnowledgeBundleSchema,
  clinicalSourcesBundleSchema,
} from '../src/lib/clinicalKnowledgeSchema';

function failValidation(title: string, issues: string[]): never {
  console.error(title);
  for (const issue of issues) console.error(`- ${issue}`);
  process.exit(1);
}

const parsedConditions = clinicalKnowledgeBundleSchema.safeParse(conditionsBundle);
if (!parsedConditions.success) {
  failValidation(
    'Clinical conditions JSON is invalid:',
    parsedConditions.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
  );
}

const parsedSources = clinicalSourcesBundleSchema.safeParse(sourcesBundle);
if (!parsedSources.success) {
  failValidation(
    'Clinical sources JSON is invalid:',
    parsedSources.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
  );
}

const parsedAssertions = clinicalAssertionsBundleSchema.safeParse(assertionsBundle);
if (!parsedAssertions.success) {
  failValidation(
    'Clinical assertions JSON is invalid:',
    parsedAssertions.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
  );
}

const conditionNames = new Set<string>();
const conditionIds = new Set<string>();

for (const condition of parsedConditions.data.conditions) {
  if (conditionNames.has(condition.name)) failValidation('Clinical conditions JSON is invalid:', [`Duplicate clinical condition name: ${condition.name}`]);
  if (conditionIds.has(condition.id)) failValidation('Clinical conditions JSON is invalid:', [`Duplicate clinical condition id: ${condition.id}`]);
  conditionNames.add(condition.name);
  conditionIds.add(condition.id);
}

const sourceIds = new Set<string>();
for (const source of parsedSources.data.sources) {
  if (sourceIds.has(source.id)) failValidation('Clinical sources JSON is invalid:', [`Duplicate clinical source id: ${source.id}`]);
  sourceIds.add(source.id);
}

const assertionIds = new Set<string>();
for (const assertion of parsedAssertions.data.assertions) {
  if (assertionIds.has(assertion.id)) failValidation('Clinical assertions JSON is invalid:', [`Duplicate clinical assertion id: ${assertion.id}`]);
  if (assertion.conditionId && !conditionIds.has(assertion.conditionId)) {
    failValidation('Clinical assertions JSON is invalid:', [`Unknown conditionId ${assertion.conditionId} in assertion ${assertion.id}`]);
  }
  if (!sourceIds.has(assertion.sourceId)) {
    failValidation('Clinical assertions JSON is invalid:', [`Unknown sourceId ${assertion.sourceId} in assertion ${assertion.id}`]);
  }
  assertionIds.add(assertion.id);
}

console.log([
  `Clinical knowledge OK: ${parsedConditions.data.conditions.length} conditions`,
  `${parsedAssertions.data.assertions.length} assertions`,
  `${parsedSources.data.sources.length} sources`,
  `bundle ${parsedConditions.data.version}.`,
].join(', '));
