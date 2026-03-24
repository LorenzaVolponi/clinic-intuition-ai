type BackendHypothesis = {
  name: string;
  role: 'mais provável' | 'mais grave a excluir' | 'diferencial comum';
  probability: 'Alta' | 'Média' | 'Baixa';
  confidenceScore: number;
  justification: string;
  physiopathology: string;
  exams: string[];
  differentials: string[];
};

export type BackendClinicalModelResponse = {
  triageLevel: 'Emergência' | 'Urgência' | 'Eletivo';
  triageReason: string;
  educationalWarning: string;
  hypotheses: BackendHypothesis[];
  investigationPlan: {
    immediate: string[];
    complementary: string[];
    specialAttention: string[];
  };
  conduct: {
    immediateActions: string[];
    monitoring: string[];
    legalNotice: string;
  };
};

const UNSUPPORTED_TERM_RULES = [
  { trigger: ['dor abdominal', 'abdome', 'fossa iliaca'], symptomKeys: ['dor abdominal', 'epigastr', 'hipocondrio', 'fossa ilíaca', 'dor no abdome'] },
  { trigger: ['dispneia', 'falta de ar'], symptomKeys: ['dispneia', 'falta de ar', 'dificuldade respir'] },
  { trigger: ['edema'], symptomKeys: ['edema', 'inchaço'] },
  { trigger: ['dor lombar'], symptomKeys: ['dor lombar'] },
];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(normalize(term)));
}

function isBackendClinicalResponse(value: unknown): value is BackendClinicalModelResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<BackendClinicalModelResponse>;
  return Array.isArray(candidate.hypotheses) && Boolean(candidate.investigationPlan) && Boolean(candidate.conduct);
}

export function validateClinicalResponse({
  patientData,
  response,
}: {
  patientData: { age: number; gender: string; symptoms: string };
  response: unknown;
}) {
  const errors: string[] = [];

  if (!isBackendClinicalResponse(response)) {
    return {
      valid: false,
      errors: ['Estrutura do JSON clínico inválida.'],
    };
  }

  const symptoms = normalize(patientData.symptoms || '');
  const isFertileWoman = normalize(patientData.gender) === 'feminino' && patientData.age >= 12 && patientData.age <= 55;
  const hasPain = includesAny(symptoms, ['dor', 'dor no peito', 'dor toracica', 'dor abdominal']);
  const hasNausea = includesAny(symptoms, ['nausea', 'enjoo', 'vomito']);
  const hasChestPain = includesAny(symptoms, ['dor no peito', 'dor toracica', 'aperto no peito']);

  const justificationBlob = normalize(
    JSON.stringify(response.hypotheses.map((item) => item.justification)) +
      JSON.stringify(response.investigationPlan) +
      JSON.stringify(response.conduct),
  );

  for (const rule of UNSUPPORTED_TERM_RULES) {
    if (includesAny(justificationBlob, rule.trigger) && !includesAny(symptoms, rule.symptomKeys)) {
      errors.push(`Possível alucinação clínica ao mencionar: ${rule.trigger.join(', ')}`);
    }
  }

  if (hasChestPain) {
    const planBlob = normalize(JSON.stringify(response.investigationPlan));
    if (!includesAny(planBlob, ['ecg', 'eletrocardiograma'])) {
      errors.push('Dor torácica sem ECG no plano sugerido.');
    }
  }

  if (isFertileWoman && hasPain && hasNausea) {
    const planBlob = normalize(JSON.stringify(response.investigationPlan));
    if (!includesAny(planBlob, ['beta-hcg', 'beta hcg', 'gravidez'])) {
      errors.push('Mulher em idade fértil com dor + náusea sem atenção para beta-HCG/gravidez.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
