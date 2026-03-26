import { z } from 'zod';

const CLINICAL_SYSTEM_PROMPT = `
Você é um assistente clínico educacional.
- Responda SOMENTE em JSON válido.
- Não invente dados.
- Inclua exames mandatórios para dor torácica (ECG) e contexto fértil com dor+náusea (beta-HCG).
`;

function buildClinicalUserPrompt(payload) {
  return `Paciente: ${JSON.stringify(payload.patientData)}\nAvaliação local: ${JSON.stringify(payload.localAssessment)}\nRetorne JSON estruturado.`;
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function includesAny(text, terms) {
  return terms.some((term) => text.includes(normalize(term)));
}

function validateClinicalResponse({ patientData, response }) {
  const errors = [];
  const symptoms = normalize(patientData?.symptoms || '');
  const hasChestPain = includesAny(symptoms, ['dor no peito', 'dor toracica', 'aperto no peito']);
  const hasPain = includesAny(symptoms, ['dor', 'dor abdominal', 'dor no peito']);
  const hasNausea = includesAny(symptoms, ['nausea', 'enjoo', 'vomito']);
  const isFertileWoman = normalize(patientData?.gender) === 'feminino' && patientData?.age >= 12 && patientData?.age <= 55;

  const planBlob = normalize(JSON.stringify(response?.investigationPlan || {}));
  if (hasChestPain && !includesAny(planBlob, ['ecg', 'eletrocardiograma'])) {
    errors.push('Dor torácica sem ECG no plano sugerido.');
  }
  if (isFertileWoman && hasPain && hasNausea && !includesAny(planBlob, ['beta-hcg', 'beta hcg', 'gravidez'])) {
    errors.push('Mulher em idade fértil com dor + náusea sem atenção para beta-HCG/gravidez.');
  }

  return { valid: errors.length === 0, errors };
}

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
  context: z
    .object({
      topicId: z.string().optional(),
      objective: z.string().optional(),
    })
    .optional(),
});

async function callGroq(messages) {
  const apiKey = process.env.GROQ_API_KEY;
  const preferredModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const models = [preferredModel, 'llama-3.1-70b-versatile', 'llama-3.1-8b-instant'];

  if (!apiKey) {
    throw new Error('Backend de IA não configurado.');
  }

  let lastError = 'Erro desconhecido ao chamar Groq.';
  for (const model of models) {
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
      lastError = `Groq ${response.status}: ${await response.text()}`;
      continue;
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      lastError = `Modelo ${model} retornou payload vazio.`;
      continue;
    }

    return JSON.parse(content);
  }

  throw new Error(lastError);
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
    suggestedExams: [
      ...new Set([
        ...(investigation.immediate || []),
        ...(investigation.complementary || []),
        ...(investigation.specialAttention || []),
        ...(fallback.suggestedExams || []),
      ]),
    ].slice(0, 8),
    immediateActions: [...new Set([...(conduct.immediateActions || []), ...(conduct.monitoring || []), ...(fallback.immediateActions || [])])].slice(0, 6),
    clinicalSummary: `${aiResponse.educationalWarning || fallback.clinicalSummary}\nResumo de segurança: ${fallback.clinicalSummary}`.slice(0, 1400),
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
    return res.status(200).json({
      ...parsed.data.localAssessment,
      analysisSource: 'local',
    });
  }

  try {
    const aiResponse = await callGroq([
      { role: 'system', content: CLINICAL_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `${buildClinicalUserPrompt(parsed.data)}\nTema educacional: ${parsed.data.context?.topicId || 'não informado'}\nObjetivo: ${
          parsed.data.context?.objective || 'não informado'
        }\nSe for emergência, priorize red flags, risco e próximos exames imediatos.`,
      },
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
    return res.status(200).json({
      ...parsed.data.localAssessment,
      analysisSource: 'local',
    });
  }
}
