import fs from 'node:fs';
import path from 'node:path';
import { buildLocalAssessment } from '../src/lib/medicalKnowledge';
import { INCOMPATIBLE_HYPOTHESIS_RULES } from '../backend/clinical-safety/rules/v1';

type CaseInput = {
  name?: string;
  age: number;
  gender: string;
  symptoms: string;
  duration: string;
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function includesAny(text: string, terms: readonly string[]) {
  return terms.some((term) => text.includes(normalize(term)));
}

function validateCase(caseData: CaseInput) {
  const assessment = buildLocalAssessment(caseData);
  const symptomsBlob = normalize(caseData.symptoms);
  const probs = assessment.hypotheses.map((item) => item.probability);
  const violations: string[] = [];

  const expected = ['Alta', 'Moderada', 'Baixa'];
  if (probs.length < 3 || probs[0] !== expected[0] || probs[1] !== expected[1] || probs[2] !== expected[2]) {
    violations.push(`Escada inválida: ${probs.join(' > ')}`);
  }

  for (const hypothesis of assessment.hypotheses) {
    if (hypothesis.probability === 'Baixa' && normalize(hypothesis.name).includes('quando sinais')) {
      continue;
    }
    const hBlob = normalize(`${hypothesis.name} ${hypothesis.explanation}`);
    for (const rule of INCOMPATIBLE_HYPOTHESIS_RULES) {
      if (includesAny(hBlob, rule.terms) && !includesAny(symptomsBlob, rule.requiredSymptoms)) {
        violations.push(`Hipótese desconexa: "${hypothesis.name}" sem sintomas obrigatórios (${rule.requiredSymptoms.join(', ')})`);
      }
    }
  }

  return {
    caseData,
    triage: assessment.triageLevel,
    hypotheses: assessment.hypotheses.map((item) => ({ name: item.name, probability: item.probability })),
    violations,
  };
}

const inputPath = process.argv[2] || path.resolve(process.cwd(), 'docs/clinical-coherence-cases.json');
if (!fs.existsSync(inputPath)) {
  console.error(`Arquivo de casos não encontrado: ${inputPath}`);
  process.exit(1);
}

const parsed = JSON.parse(fs.readFileSync(inputPath, 'utf-8')) as CaseInput[];
const results = parsed.map(validateCase);
const withViolations = results.filter((item) => item.violations.length > 0);

console.log(JSON.stringify({
  totalCases: parsed.length,
  casesWithViolations: withViolations.length,
  details: results,
}, null, 2));

if (withViolations.length > 0) {
  process.exit(2);
}
