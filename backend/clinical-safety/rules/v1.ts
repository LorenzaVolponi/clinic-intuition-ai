export const MAX_HYPOTHESES = 3;
export const MAX_CONFIDENCE_SCORE = 95;

export const LEGAL_NOTICE_REQUIRED_TERMS = ['educacional', 'preceptor', 'protocolo'];

export const UNSUPPORTED_TERM_RULES = [
  { trigger: ['dor abdominal', 'abdome', 'fossa iliaca'], symptomKeys: ['dor abdominal', 'epigastr', 'hipocondrio', 'fossa ilíaca', 'dor no abdome', 'abdome'] },
  { trigger: ['dispneia', 'falta de ar'], symptomKeys: ['dispneia', 'falta de ar', 'dificuldade respir', 'cansaço respiratório'] },
  { trigger: ['edema'], symptomKeys: ['edema', 'inchaço', 'membro inchado'] },
  { trigger: ['dor lombar'], symptomKeys: ['dor lombar', 'dor nas costas'] },
] as const;

export const INCOMPATIBLE_HYPOTHESIS_RULES = [
  { terms: ['apendicite', 'abdome agudo'], requiredSymptoms: ['dor abdominal', 'fossa ilíaca', 'epigastr'] },
  { terms: ['asma', 'broncoespasmo'], requiredSymptoms: ['sibilo', 'dispneia', 'falta de ar', 'tosse', 'aperto no peito'] },
  { terms: ['enxaqueca', 'migraine'], requiredSymptoms: ['cefaleia', 'enxaqueca', 'dor de cabeca', 'aura', 'fotofobia', 'fonofobia'] },
  { terms: ['sindrome coronariana', 'infarto', 'iam'], requiredSymptoms: ['dor no peito', 'dor toracica', 'aperto no peito', 'dispneia'] },
  { terms: ['avc', 'acidente vascular'], requiredSymptoms: ['hemiparesia', 'deficit focal', 'afasia', 'paresia'] },
] as const;

export const DEFINITIVE_DIAGNOSIS_TERMS = ['diagnostico definitivo', 'diagnostico fechado', 'certeza diagnostica'];

export const DOSAGE_PATTERN = /\b\d+([.,]\d+)?\s?(mg|g|mcg|µg|ml|mL)\b/i;
export const DOSING_INTERVAL_PATTERN = /\b\d+\s?\/\s?\d+\s?h\b/i;
