import { z } from 'zod';
import { buildClinicalUserPrompt, CLINICAL_SYSTEM_PROMPT } from '../backend/prompts.js';
import { validateClinicalResponse } from '../backend/validators.js';

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

async function callGroq(messages) {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  if (!apiKey) {
    throw new Error('Backend de IA não configurado.');
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
    throw new Error(`Groq ${response.status}: ${await response.text()}`);
  }

  const json = await response.json();
  return JSON.parse(json.choices?.[0]?.message?.content || '{}');
}

function mapClinicalResponse(aiResponse, fallback) {
  const investigation = aiResponse.investigationPlan || { immediate: [], complementary: [], specialAttention: [] };
  const conduct = aiResponse.conduct || { immediateActions: [], monitoring: [], legalNotice: '' };
  const hypotheses = Array.isArray(aiResponse.hypotheses) ? aiResponse.hypotheses.slice(0, 3) : [];

  return {
    hypotheses: hypotheses.length > 0
      ? hypotheses.map((item) => ({
          name: item.name || 'Hipótese não informada',
          probability: item.probability === 'Alta' ? 'Alta' : item.probability === 'Média' ? 'Moderada' : 'Baixa',
          treatment: `${conduct.legalNotice || 'Conduta educacional baseada em estabilização, monitorização e protocolos institucionais.'} Ações sugeridas: ${(conduct.immediateActions || []).join(', ')}`,
          explanation: `${item.justification || 'Sem justificativa estruturada.'} ${item.physiopathology || ''}`.trim(),
          differentials: item.differentials || [],
          recommendedExams: item.exams || [],
          redFlags: investigation.specialAttention || [],
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
    suggestedExams: [...new Set([...(investigation.immediate || []), ...(investigation.complementary || []), ...(investigation.specialAttention || [])])].slice(0, 8),
    immediateActions: [...new Set([...(conduct.immediateActions || []), ...(conduct.monitoring || [])])].slice(0, 6),
    clinicalSummary: aiResponse.educationalWarning || fallback.clinicalSummary,
    analysisSource: 'groq',
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parsed = clinicalRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Payload inválido.', details: parsed.error.flatten() });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ error: 'Backend de IA não configurado.' });
  }

  try {
    const aiResponse = await callGroq([
      { role: 'system', content: CLINICAL_SYSTEM_PROMPT },
      { role: 'user', content: buildClinicalUserPrompt(parsed.data) },
    ]);

    const validation = validateClinicalResponse({
      patientData: parsed.data.patientData,
      response: aiResponse,
    });

    if (!validation.valid) {
      return res.status(422).json({ error: 'Resposta da IA reprovada nas validações clínicas.', validationErrors: validation.errors });
    }

    return res.status(200).json(mapClinicalResponse(aiResponse, parsed.data.localAssessment));
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Erro inesperado no backend.' });
  }
}
