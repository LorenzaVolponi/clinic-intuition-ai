import { writeFileSync } from 'node:fs';

import assertionsBundle from '../data/clinical-knowledge/assertions.v1.json';
import conditionsBundle from '../data/clinical-knowledge/conditions.v1.json';
import sourcesBundle from '../data/clinical-knowledge/sources.v1.json';
import { buildClinicalKnowledgeSeedSql } from './clinical-knowledge-sql';

const outputPath = process.argv[2];
const sql = buildClinicalKnowledgeSeedSql(conditionsBundle, sourcesBundle, assertionsBundle);

if (outputPath) {
  writeFileSync(outputPath, sql);
  console.log(`Clinical knowledge SQL seed written to ${outputPath}`);
} else {
  process.stdout.write(sql);
}
