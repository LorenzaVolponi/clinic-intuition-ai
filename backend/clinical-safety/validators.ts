import {
  DEFINITIVE_DIAGNOSIS_TERMS,
  DOSAGE_PATTERN,
  DOSING_INTERVAL_PATTERN,
  INCOMPATIBLE_HYPOTHESIS_RULES,
  LEGAL_NOTICE_REQUIRED_TERMS,
  MAX_CONFIDENCE_SCORE,
  MAX_HYPOTHESES,
  UNSUPPORTED_TERM_RULES,
} from './rules/v1';

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

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function includesAny(text: string, terms: readonly string[]) {
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

  if (!Array.isArray(response.hypotheses) || response.hypotheses.length === 0 || response.hypotheses.length > MAX_HYPOTHESES) {
    errors.push(`Quantidade de hipóteses fora do limite seguro (1 a ${MAX_HYPOTHESES}).`);
  }

  if (!response.triageReason || response.triageReason.trim().length < 12) {
    errors.push('Justificativa de triagem insuficiente.');
  }

  const legalNotice = normalize(response.conduct?.legalNotice || '');
  if (!includesAny(legalNotice, LEGAL_NOTICE_REQUIRED_TERMS)) {
    errors.push('Aviso legal/educacional insuficiente na conduta.');
  }

  for (const hypothesis of response.hypotheses) {
    if (!hypothesis.name || hypothesis.name.trim().length < 4) {
      errors.push('Nome de hipótese insuficiente.');
    }
    if (!hypothesis.justification || hypothesis.justification.trim().length < 12) {
      errors.push(`Justificativa insuficiente na hipótese: ${hypothesis.name || 'sem nome'}`);
    }
    if (hypothesis.confidenceScore > MAX_CONFIDENCE_SCORE) {
      errors.push(`ConfidenceScore excessivo para uso educacional seguro: ${hypothesis.name}`);
    }
  }

  const narrativeBlob = normalize(
    JSON.stringify(response.hypotheses.map((item) => `${item.name} ${item.justification}`)) + JSON.stringify(response.conduct),
  );
  const rawNarrativeBlob = JSON.stringify(response.hypotheses) + JSON.stringify(response.conduct);
  if (includesAny(narrativeBlob, DEFINITIVE_DIAGNOSIS_TERMS)) {
    errors.push('Linguagem de diagnóstico definitivo não permitida em contexto educacional.');
  }
  if (DOSAGE_PATTERN.test(rawNarrativeBlob) || DOSING_INTERVAL_PATTERN.test(rawNarrativeBlob)) {
    errors.push('Dose/posologia explícita não permitida em contexto educacional.');
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
