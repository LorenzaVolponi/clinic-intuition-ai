import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { clinicalKnowledgePackSchema } from '../src/lib/clinicalKnowledgeSchema';

const knowledgePath = resolve(process.cwd(), 'data/clinical-knowledge/conditions.v1.json');
const raw = await readFile(knowledgePath, 'utf-8');
const parsed = clinicalKnowledgePackSchema.parse(JSON.parse(raw));

const ids = new Set<string>();
const names = new Set<string>();
for (const condition of parsed.conditions) {
  if (ids.has(condition.id)) throw new Error(`ID duplicado: ${condition.id}`);
  if (names.has(condition.name.toLowerCase())) throw new Error(`Condição duplicada: ${condition.name}`);
  ids.add(condition.id);
  names.add(condition.name.toLowerCase());
}

console.log(`Clinical knowledge OK: ${parsed.conditions.length} conditions, version ${parsed.version}`);
