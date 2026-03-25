import {
  buildLocalAssessment,
  ClinicalAssessment,
  DiagnosisHypothesis,
  generateClinicalPrompt,
  PatientData,
} from '@/lib/medicalKnowledge';
import { buildLocalStudyResponse, generateRandomStudyPack, GeneratedStudyPack } from '@/lib/studyContent';

interface ClinicalApiResponse {
  hypotheses: DiagnosisHypothesis[];
  emergencyWarning?: string;
  triageLevel: ClinicalAssessment['triageLevel'];
  triageReason: string;
  suggestedExams: string[];
  immediateActions: string[];
  clinicalSummary: string;
  analysisSource: 'local' | 'groq';
}

export interface AiHealthStatus {
  ok: boolean;
  providerConfigured: boolean;
  model?: string;
}

export interface StudyPackGenerationOptions {
  objective?: string;
  focus?: 'all' | 'flashcards' | 'quiz' | 'lessons';
  nonce?: string;
}

const REQUEST_TIMEOUT_MS = 15000;
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

function resolveApiUrl(path: string): string {
  if (!apiBaseUrl) return path;
  return `${apiBaseUrl.replace(/\/$/, '')}${path}`;
}

async function postJson<T>(url: string, payload: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status}: ${errorText}`);
  }

  return response.json() as Promise<T>;
}

function normalizeBackendAssessment(response: ClinicalApiResponse, localAssessment: ClinicalAssessment): ClinicalAssessment {
  return {
    hypotheses: Array.isArray(response.hypotheses) && response.hypotheses.length > 0 ? response.hypotheses : localAssessment.hypotheses,
    emergencyWarning: response.emergencyWarning || localAssessment.emergencyWarning,
    triageLevel: response.triageLevel || localAssessment.triageLevel,
    triageReason: response.triageReason || localAssessment.triageReason,
    suggestedExams: response.suggestedExams?.length ? response.suggestedExams : localAssessment.suggestedExams,
    immediateActions: response.immediateActions?.length ? response.immediateActions : localAssessment.immediateActions,
    clinicalSummary: response.clinicalSummary || localAssessment.clinicalSummary,
    analysisSource: response.analysisSource || 'groq',
  };
}

export async function analyzeClinicalCase(patientData: PatientData, context?: { topicId?: string; objective?: string }): Promise<ClinicalAssessment> {
  const localAssessment = buildLocalAssessment(patientData);

  try {
    const backendResponse = await postJson<ClinicalApiResponse>(resolveApiUrl('/api/clinical-analysis'), {
      patientData,
      localAssessment,
      promptPreview: generateClinicalPrompt(patientData, localAssessment),
      context,
    });

    return normalizeBackendAssessment(backendResponse, localAssessment);
  } catch (error) {
    console.warn('Falha ao obter análise do backend. Mantendo análise local.', error);
    return localAssessment;
  }
}

export async function askMedBot(
  question: string,
  topicId: string,
  history: Array<{ role: 'assistant' | 'user'; content: string }> = [],
  context?: { objective?: string; quickFacts?: string[]; clinicalSummary?: string; userLevel?: 'iniciante' | 'intermediario' | 'avancado' },
) {
  const localAnswer = buildLocalStudyResponse(question, topicId);

  try {
    const response = await postJson<{
      answer?: string;
      source: 'groq' | 'local';
      suggestions?: string[];
      intent?: 'resumo' | 'caso' | 'quiz' | 'medicamento' | 'comparacao' | 'duvida';
      response?: {
        content?: { text?: string };
        suggestions?: string[];
        intent?: 'resumo' | 'caso' | 'quiz' | 'medicamento' | 'comparacao' | 'duvida';
      };
    }>(resolveApiUrl('/api/medbot'), {
      topicId,
      question,
      history,
      context,
    });

    const structuredText = response.response?.content?.text;
    const structuredSuggestions = response.response?.suggestions;
    const structuredIntent = response.response?.intent;

    return {
      answer: structuredText || response.answer || localAnswer,
      source: response.source || 'groq',
      suggestions: structuredSuggestions || response.suggestions || [],
      intent: structuredIntent || response.intent,
    };
  } catch (error) {
    console.warn('Falha ao gerar resposta do MedBot via backend. Mantendo fallback local.', error);
    return {
      answer: localAnswer,
      source: 'local' as const,
      suggestions: ['caso clínico', 'quiz', 'red flags'],
      intent: 'duvida' as const,
    };
  }
}

export async function generateStudyPack(topicId: string, options?: StudyPackGenerationOptions): Promise<GeneratedStudyPack> {
  const normalizePack = (response: GeneratedStudyPack): GeneratedStudyPack => ({
    ...response,
    flashcards: response.flashcards.map((card, index) => ({
      ...card,
      id: card.id || `${response.topicId || topicId}-flashcard-${index + 1}`,
      front: card.front || card.question,
      back: card.back || card.answer,
      question: card.question || card.front || 'Conceito clínico',
      answer: card.answer || card.back || 'Revisar red flags e conduta inicial.',
      hint: card.hint || 'Associe com sinais de gravidade.',
    })),
    quiz: response.quiz.map((item, index) => {
      const optionObjects = item.optionObjects?.length
        ? item.optionObjects
        : item.options.map((option, idx) => ({ id: String.fromCharCode(65 + idx) as 'A' | 'B' | 'C' | 'D', text: option }));
      const options = optionObjects.map((option) => option.text);
      const answerFromId = item.correct_option_id
        ? optionObjects.find((option) => option.id === item.correct_option_id)?.text
        : undefined;

      return {
        ...item,
        id: item.id || `${response.topicId || topicId}-quiz-${index + 1}`,
        difficulty: item.difficulty || (index % 3 === 0 ? 'easy' : index % 3 === 1 ? 'medium' : 'hard'),
        scenario: item.scenario || '',
        optionObjects,
        options,
        correct_option_id: item.correct_option_id || 'A',
        answer: item.answer || answerFromId || options[0] || 'Resposta indisponível',
      };
    }),
  });

  try {
    const response = await postJson<GeneratedStudyPack>(resolveApiUrl('/api/study-pack'), {
      topicId,
      objective: options?.objective,
      focus: options?.focus || 'all',
      nonce: options?.nonce,
    });
    if (
      Array.isArray(response.quiz) &&
      Array.isArray(response.lessons) &&
      Array.isArray(response.flashcards) &&
      response.quiz.length > 0 &&
      response.lessons.length > 0 &&
      response.flashcards.length > 0
    ) {
      return normalizePack(response);
    }
    return generateRandomStudyPack(topicId);
  } catch (error) {
    console.warn('Falha ao gerar estudo no backend. Mantendo geração local.', error);
    return generateRandomStudyPack(topicId);
  }
}

export async function getAiHealthStatus(): Promise<AiHealthStatus> {
  try {
    const response = await fetch(resolveApiUrl('/api/health'));
    if (!response.ok) {
      throw new Error(`health check failed: ${response.status}`);
    }

    const parsed = (await response.json()) as AiHealthStatus;
    return {
      ok: Boolean(parsed.ok),
      providerConfigured: Boolean(parsed.providerConfigured),
      model: parsed.model,
    };
  } catch (error) {
    console.warn('Falha ao verificar saúde da IA. Seguindo em modo local.', error);
    return {
      ok: false,
      providerConfigured: false,
    };
  }
}
