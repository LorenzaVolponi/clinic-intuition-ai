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

const REQUEST_TIMEOUT_MS = 15000;

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

export async function analyzeClinicalCase(patientData: PatientData): Promise<ClinicalAssessment> {
  const localAssessment = buildLocalAssessment(patientData);

  try {
    const backendResponse = await postJson<ClinicalApiResponse>('/api/clinical-analysis', {
      patientData,
      localAssessment,
      promptPreview: generateClinicalPrompt(patientData, localAssessment),
    });

    return normalizeBackendAssessment(backendResponse, localAssessment);
  } catch (error) {
    console.warn('Falha ao obter análise do backend. Mantendo análise local.', error);
    return localAssessment;
  }
}

export async function askMedBot(question: string, topicId: string, history: Array<{ role: 'assistant' | 'user'; content: string }> = []) {
  const localAnswer = buildLocalStudyResponse(question, topicId);

  try {
    const response = await postJson<{ answer: string; source: 'groq' | 'local' }>('/api/medbot', {
      topicId,
      question,
      history,
    });

    return {
      answer: response.answer || localAnswer,
      source: response.source || 'groq',
    };
  } catch (error) {
    console.warn('Falha ao gerar resposta do MedBot via backend. Mantendo fallback local.', error);
    return {
      answer: localAnswer,
      source: 'local' as const,
    };
  }
}

export async function generateStudyPack(topicId: string): Promise<GeneratedStudyPack> {
  try {
    const response = await postJson<GeneratedStudyPack>('/api/study-pack', { topicId });
    if (Array.isArray(response.quiz) && Array.isArray(response.lessons) && response.quiz.length > 0 && response.lessons.length > 0) {
      return response;
    }
    return generateRandomStudyPack(topicId);
  } catch (error) {
    console.warn('Falha ao gerar estudo no backend. Mantendo geração local.', error);
    return generateRandomStudyPack(topicId);
  }
}
