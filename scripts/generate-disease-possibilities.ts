import fs from 'node:fs';
import path from 'node:path';
import { MEDICAL_CONDITIONS } from '../src/lib/medicalKnowledge';

type DiseasePossibility = {
  id: string;
  baseCondition: string;
  urgency: string;
  ageGroup: string;
  durationProfile: string;
  scenarioTag: string;
  keySymptoms: string[];
  generatedHypothesisLabel: string;
};

const AGE_GROUPS = ['crianca', 'adolescente', 'adulto', 'idoso', 'gestante'];
const DURATION_PROFILES = ['hiperagudo', 'agudo', 'subagudo', 'cronico', 'indefinido'];
const SCENARIO_TAGS = ['tipico', 'atipico', 'com-red-flag', 'inicio-recente', 'progressivo'];
const CLINICAL_CONTEXTS = ['leve', 'moderado', 'grave', 'comorbidades', 'pos-infeccioso', 'recorrente', 'refratario', 'pos-trauma'];

function buildPossibilities(): DiseasePossibility[] {
  const possibilities: DiseasePossibility[] = [];

  for (const condition of MEDICAL_CONDITIONS) {
    for (const ageGroup of AGE_GROUPS) {
      for (const durationProfile of DURATION_PROFILES) {
        for (const scenarioTag of SCENARIO_TAGS) {
          for (const context of CLINICAL_CONTEXTS) {
            const keySymptoms = [...new Set([...condition.commonSymptoms, ...condition.redFlags])].slice(0, 5);
            const id = `${condition.name}-${ageGroup}-${durationProfile}-${scenarioTag}-${context}`
              .toLowerCase()
              .normalize('NFD')
              .replace(/\p{Diacritic}/gu, '')
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '');

            possibilities.push({
              id,
              baseCondition: condition.name,
              urgency: condition.urgencyLevel,
              ageGroup,
              durationProfile,
              scenarioTag: `${scenarioTag}:${context}`,
              keySymptoms,
              generatedHypothesisLabel: `${condition.name} (${ageGroup}, ${durationProfile}, ${scenarioTag}, ${context})`,
            });
          }
        }
      }
    }
  }

  return possibilities;
}

const outputPath = process.argv[2] || path.resolve(process.cwd(), 'docs/generated-disease-possibilities.json');
const possibilities = buildPossibilities();
const payload = {
  generatedAt: new Date().toISOString(),
  total: possibilities.length,
  minimumExpected: 10000,
  possibilities,
};

if (payload.total < payload.minimumExpected) {
  console.error(`Falha: geradas ${payload.total} possibilidades, abaixo do mínimo ${payload.minimumExpected}.`);
  process.exit(2);
}

fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');
console.log(`Arquivo gerado: ${outputPath}`);
console.log(`Total de possibilidades: ${payload.total}`);
