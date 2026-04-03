export type CaseFacts = {
  explicitSymptoms: string[];
  mentionedMedications: string[];
  reportedActions: string[];
  durationHints: string[];
};

const SYMPTOM_TERMS = [
  'cefaleia',
  'enxaqueca',
  'dor de cabeça',
  'fotofobia',
  'visão turva',
  'aura',
  'palpitações',
  'dispneia',
  'dor torácica',
  'náusea',
  'vômito',
  'tontura',
  'febre',
  'parestesia',
];

const MEDICATION_TERMS = [
  'dipirona',
  'paracetamol',
  'ibuprofeno',
  'captopril',
  'losartana',
  'propranolol',
  'ceffalium',
];

const ACTION_TERMS = ['soro', 'hidratação venosa', 'medicou', 'tomou', 'usou', 'aplicou'];

const DURATION_TERMS = ['horas', 'dias', 'semanas', 'meses', 'hoje', 'ontem', 'agora'];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function unique(values: string[]) {
  return [...new Set(values)];
}

export function extractCaseFacts(input: { symptoms?: string; duration?: string }): CaseFacts {
  const symptomsText = normalize(input.symptoms || '');
  const durationText = normalize(input.duration || '');
  const joined = `${symptomsText} ${durationText}`;

  const explicitSymptoms = unique(SYMPTOM_TERMS.filter((term) => joined.includes(normalize(term))));
  const mentionedMedications = unique(MEDICATION_TERMS.filter((term) => joined.includes(normalize(term))));
  const reportedActions = unique(ACTION_TERMS.filter((term) => joined.includes(normalize(term))));
  const durationHints = unique(DURATION_TERMS.filter((term) => joined.includes(normalize(term))));

  return {
    explicitSymptoms,
    mentionedMedications,
    reportedActions,
    durationHints,
  };
}
