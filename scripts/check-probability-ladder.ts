import { buildLocalAssessment } from '../src/lib/medicalKnowledge';

const symptoms = process.env.CASE_TEXT || '';
const duration = process.env.CASE_DURATION || '1-7d';
const age = Number(process.env.CASE_AGE || 35);
const gender = process.env.CASE_GENDER || 'Não informado';

if (!symptoms.trim()) {
  console.error('Defina CASE_TEXT para validar a escada Alta/Moderada/Baixa.');
  process.exit(1);
}

const assessment = buildLocalAssessment({
  name: 'Caso Script',
  age,
  gender,
  symptoms,
  duration,
});

const probabilities = assessment.hypotheses.map((item) => item.probability);
const ok = probabilities.length >= 3 && probabilities[0] === 'Alta' && probabilities[1] === 'Moderada' && probabilities[2] === 'Baixa';

console.log(JSON.stringify({
  ok,
  probabilities,
  hypotheses: assessment.hypotheses.map((item) => ({ name: item.name, probability: item.probability, explanation: item.explanation })),
}, null, 2));

if (!ok) process.exit(2);
