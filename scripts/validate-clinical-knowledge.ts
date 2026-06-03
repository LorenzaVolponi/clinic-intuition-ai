import conditionsBundle from '../data/clinical-knowledge/conditions.v1.json';
import { clinicalKnowledgeBundleSchema } from '../src/lib/clinicalKnowledgeSchema';

const parsed = clinicalKnowledgeBundleSchema.safeParse(conditionsBundle);

if (!parsed.success) {
  console.error('Clinical knowledge JSON is invalid:');
  for (const issue of parsed.error.issues) {
    console.error(`- ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

const conditionNames = new Set<string>();
const conditionIds = new Set<string>();

for (const condition of parsed.data.conditions) {
  if (conditionNames.has(condition.name)) {
    console.error(`Duplicate clinical condition name: ${condition.name}`);
    process.exit(1);
  }
  if (conditionIds.has(condition.id)) {
    console.error(`Duplicate clinical condition id: ${condition.id}`);
    process.exit(1);
  }
  conditionNames.add(condition.name);
  conditionIds.add(condition.id);
}

console.log(`Clinical knowledge OK: ${parsed.data.conditions.length} conditions in ${parsed.data.version}.`);
