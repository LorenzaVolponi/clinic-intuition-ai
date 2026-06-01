import { ClinicalAssessment, PatientData } from '@/lib/medicalKnowledge';

const MAX_ITEMS_PER_SECTION = 3;

function joinLimited(items: string[], fallback: string) {
  const safeItems = items.filter(Boolean).slice(0, MAX_ITEMS_PER_SECTION);
  if (safeItems.length === 0) return fallback;
  return safeItems.join('; ');
}

function buildEmergencyIntro(assessment: ClinicalAssessment) {
  if (assessment.triageLevel !== 'Emergência') return '';

  return 'Atenção: este caso foi classificado como emergência no simulador educacional. Em uma situação real, procure atendimento imediato e acione o serviço de emergência local. ';
}

export function formatAssessmentForSpeech(assessment: ClinicalAssessment, patientData?: PatientData) {
  const topHypotheses = assessment.hypotheses
    .slice(0, MAX_ITEMS_PER_SECTION)
    .map((hypothesis) => `${hypothesis.name}, probabilidade ${hypothesis.probability.toLowerCase()}`);
  const exams = joinLimited(assessment.suggestedExams, 'exames serão definidos conforme avaliação presencial');
  const actions = joinLimited(assessment.immediateActions, 'reavaliar sinais vitais, complementar anamnese e observar evolução');
  const symptoms = patientData?.symptoms ? `Sintomas relatados: ${patientData.symptoms}. ` : '';
  const vitalSigns = patientData?.vitalSigns
    ? [
      patientData.vitalSigns.temperature !== undefined ? `temperatura ${patientData.vitalSigns.temperature} graus` : '',
      patientData.vitalSigns.heartRate !== undefined ? `frequência cardíaca ${patientData.vitalSigns.heartRate}` : '',
      patientData.vitalSigns.systolicBp !== undefined ? `pressão ${patientData.vitalSigns.systolicBp} por ${patientData.vitalSigns.diastolicBp ?? 'não informada'}` : '',
      patientData.vitalSigns.respiratoryRate !== undefined ? `frequência respiratória ${patientData.vitalSigns.respiratoryRate}` : '',
      patientData.vitalSigns.oxygenSaturation !== undefined ? `saturação ${patientData.vitalSigns.oxygenSaturation} por cento` : '',
    ].filter(Boolean).join(', ')
    : '';

  return [
    buildEmergencyIntro(assessment),
    symptoms,
    vitalSigns ? `Sinais vitais informados: ${vitalSigns}. ` : '',
    `Triagem: ${assessment.triageLevel}. ${assessment.triageReason}. `,
    `Resumo clínico: ${assessment.clinicalSummary}. `,
    `Hipóteses principais: ${topHypotheses.length > 0 ? topHypotheses.join('; ') : 'quadro inespecífico que exige mais dados'}. `,
    `Exames iniciais sugeridos: ${exams}. `,
    `Ações imediatas: ${actions}. `,
    'Aviso: esta é uma simulação educacional e não substitui avaliação médica presencial, preceptor ou protocolo institucional.',
  ].join('').replace(/\s+/g, ' ').trim();
}
