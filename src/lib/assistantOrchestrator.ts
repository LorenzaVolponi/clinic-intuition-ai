import { ClinicalAssessment, PatientData } from '@/lib/medicalKnowledge';
import { formatAssessmentForSpeech } from '@/lib/spokenClinicalFormatter';

export type AssistantIntent = 'summary' | 'red_flags' | 'exams' | 'actions' | 'new_case' | 'case_status' | 'help' | 'unknown';

export interface AssistantContext {
  patientData: PatientData | null;
  diagnosis: ClinicalAssessment | null;
}

export interface AssistantCommandResult {
  intent: AssistantIntent;
  title: string;
  message: string;
  shouldReset?: boolean;
}

function normalizeCommand(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();
}

function includesAny(input: string, terms: string[]) {
  return terms.some((term) => input.includes(term));
}

function uniqueItems(items: string[]) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function listOrFallback(items: string[], fallback: string, limit = 6) {
  const safeItems = uniqueItems(items).slice(0, limit);
  if (safeItems.length === 0) return fallback;
  return safeItems.map((item) => `• ${item}`).join('\n');
}

export function classifyAssistantIntent(input: string): AssistantIntent {
  const normalized = normalizeCommand(input);

  if (!normalized) return 'help';
  if (includesAny(normalized, ['novo caso', 'reset', 'reiniciar', 'limpar', 'apagar caso', 'zerar'])) return 'new_case';
  if (includesAny(normalized, ['red flag', 'sinal de alarme', 'sinais de alarme', 'alarme', 'gravidade'])) return 'red_flags';
  if (includesAny(normalized, ['exame', 'investigacao', 'investigação', 'pedir agora', 'solicitar'])) return 'exams';
  if (includesAny(normalized, ['acao', 'acoes', 'ação', 'ações', 'conduta', 'condutas', 'fazer agora', 'proximo passo', 'próximo passo'])) return 'actions';
  if (includesAny(normalized, ['status', 'ultimo caso', 'último caso', 'paciente', 'anamnese atual', 'caso atual'])) return 'case_status';
  if (includesAny(normalized, ['resumo', 'resuma', 'triagem', 'hipotese', 'hipótese', 'ler resultado', 'explica', 'explicar'])) return 'summary';
  if (includesAny(normalized, ['ajuda', 'comandos', 'o que voce faz', 'o que você faz'])) return 'help';

  return 'unknown';
}

function requireDiagnosis(context: AssistantContext, intent: AssistantIntent): AssistantCommandResult | null {
  if (context.diagnosis && context.patientData) return null;

  return {
    intent,
    title: 'Ainda preciso de um caso analisado',
    message:
      'Preencha a anamnese fictícia e toque em “Analisar Caso Clínico”. Depois eu consigo resumir, listar red flags, exames e ações imediatas por texto ou voz.',
  };
}

export function runAssistantCommand(input: string, context: AssistantContext): AssistantCommandResult {
  const intent = classifyAssistantIntent(input);

  if (intent === 'help') {
    return {
      intent,
      title: 'Comandos disponíveis',
      message:
        'Você pode dizer ou digitar: “resuma o caso”, “quais red flags?”, “quais exames?”, “ações imediatas”, “status do caso” ou “novo caso”. Tudo continua em modo educacional e depende da anamnese simulada.',
    };
  }

  if (intent === 'new_case') {
    return {
      intent,
      title: 'Novo caso iniciado',
      message: 'Certo. Limpei a sessão local e deixei o simulador pronto para uma nova anamnese fictícia.',
      shouldReset: true,
    };
  }

  if (intent === 'unknown') {
    return {
      intent,
      title: 'Não entendi o comando com segurança',
      message:
        'Tente um comando mais direto, como “resuma o caso”, “quais red flags?”, “quais exames?”, “ações imediatas” ou “novo caso”.',
    };
  }

  const missingDiagnosis = requireDiagnosis(context, intent);
  if (missingDiagnosis) return missingDiagnosis;

  const diagnosis = context.diagnosis as ClinicalAssessment;
  const patientData = context.patientData as PatientData;

  if (intent === 'summary') {
    return {
      intent,
      title: 'Resumo seguro do caso',
      message: formatAssessmentForSpeech(diagnosis, patientData),
    };
  }

  if (intent === 'red_flags') {
    const redFlags = diagnosis.hypotheses.flatMap((hypothesis) => hypothesis.redFlags);
    return {
      intent,
      title: 'Red flags e sinais de gravidade',
      message: `${diagnosis.emergencyWarning ? `${diagnosis.emergencyWarning}\n\n` : ''}${listOrFallback(redFlags, 'Nenhum sinal de alarme específico foi destacado nas hipóteses locais, mas sinais vitais e exame físico seguem obrigatórios.')}`,
    };
  }

  if (intent === 'exams') {
    return {
      intent,
      title: 'Exames sugeridos',
      message: listOrFallback(diagnosis.suggestedExams, 'O simulador não listou exames específicos; complemente com exame físico, sinais vitais e protocolo institucional.'),
    };
  }

  if (intent === 'actions') {
    return {
      intent,
      title: 'Ações imediatas',
      message: `${listOrFallback(diagnosis.immediateActions, 'Reavaliar sinais vitais, complementar anamnese e discutir com preceptor/protocolo local.')}\n\nAviso: conduta real exige avaliação presencial e protocolo institucional.`,
    };
  }

  return {
    intent: 'case_status',
    title: 'Status do caso atual',
    message: `Caso atual: ${patientData.name || 'paciente fictício'}, ${patientData.age} anos, gênero ${patientData.gender || 'não informado'}, sintomas: ${patientData.symptoms}. Triagem atual: ${diagnosis.triageLevel}.`,
  };
}
