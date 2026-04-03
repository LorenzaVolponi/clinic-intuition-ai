import { extractCaseFacts } from '../backend/clinical-safety/parser';

const symptoms = process.env.CASE_TEXT || '';
const duration = process.env.CASE_DURATION || '';

if (!symptoms.trim()) {
  console.error('Defina CASE_TEXT com o relato clínico.');
  process.exit(1);
}

const facts = extractCaseFacts({ symptoms, duration });

console.log(JSON.stringify({
  input: { symptoms, duration },
  extracted: facts,
}, null, 2));
