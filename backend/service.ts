import { z } from 'zod';
import { buildClinicalUserPrompt, CLINICAL_SYSTEM_PROMPT, MEDBOT_SYSTEM_PROMPT } from './prompts';
import { validateClinicalResponse, type BackendClinicalModelResponse } from './validators';

const patientDataSchema = z.object({
  name: z.string().optional(),
  age: z.number(),
  gender: z.string(),
  symptoms: z.string(),
  duration: z.string(),
});

const diagnosisHypothesisSchema = z.object({
  name: z.string(),
  probability: z.enum(['Alta', 'Moderada', 'Baixa']),
  treatment: z.string(),
  explanation: z.string(),
  differentials: z.array(z.string()),
  recommendedExams: z.array(z.string()),
  redFlags: z.array(z.string()),
  score: z.number(),
});

const localAssessmentSchema = z.object({
  hypotheses: z.array(diagnosisHypothesisSchema),
  emergencyWarning: z.string().optional(),
  triageLevel: z.enum(['Emergência', 'Urgente', 'Prioritário', 'Ambulatorial']),
  triageReason: z.string(),
  suggestedExams: z.array(z.string()),
  immediateActions: z.array(z.string()),
  clinicalSummary: z.string(),
  analysisSource: z.enum(['local', 'groq']),
});

export const clinicalRequestSchema = z.object({
  patientData: patientDataSchema,
  localAssessment: localAssessmentSchema,
});

export const medbotRequestSchema = z.object({
  topicId: z.string(),
  question: z.string().min(1),
  history: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })).optional(),
});

export type ClinicalRequest = z.infer<typeof clinicalRequestSchema>;
export type LocalAssessment = z.infer<typeof localAssessmentSchema>;
export type MedbotRequest = z.infer<typeof medbotRequestSchema>;

type GroqContentResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

function getAiConfig() {
  return {
    apiKey: process.env.GROQ_API_KEY?.trim(),
    model: process.env.GROQ_MODEL?.trim() || 'llama-3.3-70b-versatile',
  };
}

async function callGroq(messages: Array<{ role: 'system' | 'user'; content: string }>) {
  const { apiKey, model } = getAiConfig();

  if (!apiKey) {
    throw new Error('Backend IA não configurado. Defina GROQ_API_KEY.');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      top_p: 0.5,
      response_format: { type: 'json_object' },
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq ${response.status}: ${errorText}`);
  }

  const json = (await response.json()) as GroqContentResponse;
  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Resposta vazia da IA.');
  }

  return JSON.parse(content) as Record<string, unknown>;
}

function mapClinicalResponse(aiResponse: BackendClinicalModelResponse, fallback: LocalAssessment) {
  const investigation = aiResponse.investigationPlan;
  const conduct = aiResponse.conduct;
  const hypotheses = aiResponse.hypotheses.slice(0, 3);

  return {
    hypotheses: hypotheses.length > 0
      ? hypotheses.map((item) => ({
          name: item.name || 'Hipótese não informada',
          probability: item.probability === 'Alta' ? 'Alta' : item.probability === 'Média' ? 'Moderada' : 'Baixa',
          treatment: `${conduct.legalNotice || 'Conduta educacional baseada em estabilização, monitorização e protocolos institucionais.'} Ações sugeridas: ${conduct.immediateActions.join(', ')}`,
          explanation: `${item.justification || 'Sem justificativa estruturada.'} ${item.physiopathology || ''}`.trim(),
          differentials: item.differentials,
          recommendedExams: item.exams,
          redFlags: investigation.specialAttention,
          score: typeof item.confidenceScore === 'number' ? Math.max(0, Math.min(item.confidenceScore, 100)) : 70,
        }))
      : fallback.hypotheses,
    emergencyWarning:
      aiResponse.triageLevel === 'Emergência'
        ? '🚨 Caso potencialmente crítico em contexto educacional. Encaminhar imediatamente para avaliação presencial/emergência.'
        : fallback.emergencyWarning,
    triageLevel:
      aiResponse.triageLevel === 'Urgência'
        ? 'Urgente'
        : aiResponse.triageLevel === 'Emergência'
          ? 'Emergência'
          : aiResponse.triageLevel === 'Eletivo'
            ? 'Ambulatorial'
            : fallback.triageLevel,
    triageReason: aiResponse.triageReason || fallback.triageReason,
    suggestedExams: [
      ...new Set([...investigation.immediate, ...investigation.complementary, ...investigation.specialAttention]),
    ].slice(0, 8),
    immediateActions: [...new Set([...conduct.immediateActions, ...conduct.monitoring])].slice(0, 6),
    clinicalSummary: aiResponse.educationalWarning || fallback.clinicalSummary,
    analysisSource: 'groq' as const,
  };
}

export function getHealthPayload() {
  const { apiKey, model } = getAiConfig();
  return { ok: true, providerConfigured: Boolean(apiKey), model };
}

export async function processClinicalAnalysis(payload: ClinicalRequest) {
  const { apiKey } = getAiConfig();

  if (!apiKey) {
    return { status: 503, body: { error: 'Backend de IA não configurado.' } };
  }

  const aiResponse = await callGroq([
    { role: 'system', content: CLINICAL_SYSTEM_PROMPT },
    { role: 'user', content: buildClinicalUserPrompt(payload) },
  ]);

  const validation = validateClinicalResponse({
    patientData: payload.patientData,
    response: aiResponse,
  });

  if (!validation.valid) {
    return {
      status: 422,
      body: {
        error: 'Resposta da IA reprovada nas validações clínicas.',
        validationErrors: validation.errors,
      },
    };
  }

  return {
    status: 200,
    body: mapClinicalResponse(aiResponse, payload.localAssessment),
  };
}

export async function processMedbot(payload: MedbotRequest) {
  const { apiKey } = getAiConfig();

  if (!apiKey) {
    return { status: 503, body: { error: 'Backend de IA não configurado.' } };
  }

  const historyText = (payload.history || []).slice(-6).map((item) => `${item.role}: ${item.content}`).join('\n');
  const response = (await callGroq([
    { role: 'system', content: MEDBOT_SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Tema: ${payload.topicId}\nHistórico recente:\n${historyText || 'Sem histórico'}\nPergunta atual: ${payload.question}`,
    },
  ])) as { answer?: string };

  return {
    status: 200,
    body: {
      answer: response.answer || 'Resposta indisponível.',
      source: 'groq',
    },
  };
}
