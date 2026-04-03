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
  { trigger: ['dor abdominal', 'abdome', 'fossa iliaca'], symptomKeys: ['dor abdominal', 'epigastr', 'hipocondrio', 'fossa ilíaca', 'dor no abdome', 'abdome'] },
  { trigger: ['dispneia', 'falta de ar'], symptomKeys: ['dispneia', 'falta de ar', 'dificuldade respir', 'cansaço respiratório'] },
  { trigger: ['edema'], symptomKeys: ['edema', 'inchaço', 'membro inchado'] },
  { trigger: ['dor lombar'], symptomKeys: ['dor lombar', 'dor nas costas'] },
];

const INCOMPATIBLE_HYPOTHESIS_RULES = [
  { terms: ['apendicite', 'abdome agudo'], requiredSymptoms: ['dor abdominal', 'fossa ilíaca', 'epigastr'] },
  { terms: ['sindrome coronariana', 'infarto', 'iam'], requiredSymptoms: ['dor no peito', 'dor toracica', 'aperto no peito', 'dispneia'] },
  { terms: ['avc', 'acidente vascular'], requiredSymptoms: ['hemiparesia', 'deficit focal', 'afasia', 'paresia'] },
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
  const primaryHypothesisBlob = normalize(response.hypotheses[0]?.name || '');

  if (!Array.isArray(response.hypotheses) || response.hypotheses.length === 0 || response.hypotheses.length > 3) {
    errors.push('Quantidade de hipóteses fora do limite seguro (1 a 3).');
  }

  if (!response.triageReason || response.triageReason.trim().length < 12) {
    errors.push('Justificativa de triagem insuficiente.');
  }

  for (const hypothesis of response.hypotheses) {
    if (hypothesis.confidenceScore > 95) {
      errors.push(`ConfidenceScore excessivo para uso educacional seguro: ${hypothesis.name}`);
    }
  }

  for (const rule of UNSUPPORTED_TERM_RULES) {
    const mentionsRuleInPrimaryHypothesis = includesAny(primaryHypothesisBlob, rule.trigger);
    const mentionsRuleInJustification = includesAny(justificationBlob, rule.trigger);
    const symptomSupported = includesAny(symptoms, rule.symptomKeys);

    if (mentionsRuleInPrimaryHypothesis && mentionsRuleInJustification && !symptomSupported) {
      errors.push(`Possível alucinação clínica ao mencionar: ${rule.trigger.join(', ')}`);
    }
  }

  const hypothesisBlob = normalize(
    JSON.stringify(response.hypotheses.map((item) => `${item.name} ${item.justification} ${item.physiopathology}`)),
  );
  for (const rule of INCOMPATIBLE_HYPOTHESIS_RULES) {
    const mentionsCondition = includesAny(hypothesisBlob, rule.terms);
    const hasCompatibleSymptoms = includesAny(symptoms, rule.requiredSymptoms);
    if (mentionsCondition && !hasCompatibleSymptoms) {
      errors.push(`Hipótese incompatível com sintomas explícitos: ${rule.terms.join(', ')}`);
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
