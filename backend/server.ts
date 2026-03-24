import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { z } from 'zod';
import { buildClinicalUserPrompt, CLINICAL_SYSTEM_PROMPT, MEDBOT_SYSTEM_PROMPT } from './prompts';
import { validateClinicalResponse, type BackendClinicalModelResponse } from './validators';

dotenv.config();

const app = express();
const port = Number(process.env.BACKEND_PORT || 8787);
const groqApiKey = process.env.GROQ_API_KEY?.trim();
const groqModel = process.env.GROQ_MODEL?.trim() || 'llama-3.3-70b-versatile';

app.use(cors());
app.use(express.json({ limit: '1mb' }));

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

const clinicalRequestSchema = z.object({
  patientData: patientDataSchema,
  localAssessment: localAssessmentSchema,
});

const medbotRequestSchema = z.object({
  topicId: z.string(),
  question: z.string().min(1),
  history: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })).optional(),
});

type LocalAssessment = z.infer<typeof localAssessmentSchema>;

type GroqContentResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

const clinicalModelResponseSchema = z.object({
  triageLevel: z.enum(['Eletivo', 'Urgência', 'Emergência']),
  triageReason: z.string(),
  educationalWarning: z.string(),
  hypotheses: z.array(
    z.object({
      name: z.string(),
      role: z.enum(['mais provável', 'mais grave a excluir', 'diferencial comum']),
      probability: z.enum(['Alta', 'Média', 'Baixa']),
      confidenceScore: z.number().min(0).max(100),
      justification: z.string(),
      physiopathology: z.string(),
      differentials: z.array(z.string()),
      exams: z.array(z.string()),
    }),
  ),
  investigationPlan: z.object({
    immediate: z.array(z.string()),
    complementary: z.array(z.string()),
    specialAttention: z.array(z.string()),
  }),
  conduct: z.object({
    immediateActions: z.array(z.string()),
    monitoring: z.array(z.string()),
    legalNotice: z.string(),
  }),
});

const medbotModelResponseSchema = z.object({
  answer: z.string().min(1),
});

async function callGroq(messages: Array<{ role: 'system' | 'user'; content: string }>) {
  if (!groqApiKey) {
    throw new Error('Backend IA não configurado. Defina GROQ_API_KEY.');
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${groqApiKey}`,
    },
    body: JSON.stringify({
      model: groqModel,
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

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, providerConfigured: Boolean(groqApiKey), model: groqModel });
});

app.post('/api/clinical-analysis', async (req, res) => {
  const parsed = clinicalRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Payload inválido.', details: parsed.error.flatten() });
  }

  if (!groqApiKey) {
    return res.status(503).json({ error: 'Backend de IA não configurado.' });
  }

  try {
    const rawAiResponse = await callGroq([
      { role: 'system', content: CLINICAL_SYSTEM_PROMPT },
      { role: 'user', content: buildClinicalUserPrompt(parsed.data) },
    ]);
    const aiResponse = clinicalModelResponseSchema.parse(rawAiResponse);

    const validation = validateClinicalResponse({
      patientData: parsed.data.patientData,
      response: aiResponse,
    });

    if (!validation.valid) {
      return res.status(422).json({
        error: 'Resposta da IA reprovada nas validações clínicas.',
        validationErrors: validation.errors,
      });
    }

    return res.json(mapClinicalResponse(aiResponse, parsed.data.localAssessment));
  } catch (error) {
    console.error('clinical-analysis error', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Erro inesperado no backend.' });
  }
});

app.post('/api/medbot', async (req, res) => {
  const parsed = medbotRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: 'Payload inválido.', details: parsed.error.flatten() });
  }

  if (!groqApiKey) {
    return res.status(503).json({ error: 'Backend de IA não configurado.' });
  }

  try {
    const historyText = (parsed.data.history || []).slice(-6).map((item) => `${item.role}: ${item.content}`).join('\n');
    const rawResponse = await callGroq([
      { role: 'system', content: MEDBOT_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Tema: ${parsed.data.topicId}\nHistórico recente:\n${historyText || 'Sem histórico'}\nPergunta atual: ${parsed.data.question}`,
      },
    ]);
    const response = medbotModelResponseSchema.safeParse(rawResponse);

    return res.json({ answer: response.success ? response.data.answer : 'Resposta indisponível.', source: 'groq' });
  } catch (error) {
    console.error('medbot error', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Erro inesperado no backend.' });
  }
});

app.listen(port, () => {
  console.log(`Backend MedInnova rodando em http://localhost:${port}`);
});
