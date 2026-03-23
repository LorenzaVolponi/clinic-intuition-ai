import { buildLocalAssessment, ClinicalAssessment, DiagnosisHypothesis, generateClinicalPrompt, PatientData } from '@/lib/medicalKnowledge';

interface GroqChoice {
  message?: {
    content?: string;
  };
}

interface GroqResponse {
  choices?: GroqChoice[];
}

function sanitizeHypothesis(item: Partial<DiagnosisHypothesis>): DiagnosisHypothesis {
  return {
    name: item.name?.trim() || 'Hipótese clínica não especificada',
    probability: item.probability === 'Alta' || item.probability === 'Moderada' || item.probability === 'Baixa' ? item.probability : 'Moderada',
    treatment: item.treatment?.trim() || 'Conduta educacional não informada.',
    explanation: item.explanation?.trim() || 'Explicação clínica não informada.',
    differentials: Array.isArray(item.differentials) ? item.differentials.slice(0, 4).map(String) : [],
    recommendedExams: Array.isArray(item.recommendedExams) ? item.recommendedExams.slice(0, 4).map(String) : [],
    redFlags: Array.isArray(item.redFlags) ? item.redFlags.slice(0, 4).map(String) : [],
    score: typeof item.score === 'number' ? item.score : 80,
  };
}

function extractJson(content: string) {
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('Resposta da IA sem JSON válido.');
  }

  return JSON.parse(match[0]);
}

function mergeAssessments(localAssessment: ClinicalAssessment, remote: Partial<ClinicalAssessment>): ClinicalAssessment {
  return {
    hypotheses: Array.isArray(remote.hypotheses) && remote.hypotheses.length > 0
      ? remote.hypotheses.slice(0, 3).map((item) => sanitizeHypothesis(item as Partial<DiagnosisHypothesis>))
      : localAssessment.hypotheses,
    emergencyWarning: remote.emergencyWarning || localAssessment.emergencyWarning,
    triageLevel: remote.triageLevel || localAssessment.triageLevel,
    triageReason: remote.triageReason || localAssessment.triageReason,
    suggestedExams: Array.isArray(remote.suggestedExams) && remote.suggestedExams.length > 0
      ? remote.suggestedExams.slice(0, 6).map(String)
      : localAssessment.suggestedExams,
    immediateActions: Array.isArray(remote.immediateActions) && remote.immediateActions.length > 0
      ? remote.immediateActions.slice(0, 5).map(String)
      : localAssessment.immediateActions,
    clinicalSummary: remote.clinicalSummary || localAssessment.clinicalSummary,
    analysisSource: 'groq',
  };
}

export async function analyzeClinicalCase(patientData: PatientData): Promise<ClinicalAssessment> {
  const localAssessment = buildLocalAssessment(patientData);
  const apiKey = import.meta.env.VITE_GROQ_API_KEY?.trim();
  const model = import.meta.env.VITE_GROQ_MODEL?.trim() || 'llama-3.3-70b-versatile';

  if (!apiKey) {
    return localAssessment;
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'Você é um tutor clínico educacional. Nunca afirme diagnóstico definitivo e sempre preserve avisos de segurança.',
          },
          {
            role: 'user',
            content: generateClinicalPrompt(patientData, localAssessment),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Groq respondeu com status ${response.status}`);
    }

    const data = (await response.json()) as GroqResponse;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Groq não retornou conteúdo de análise.');
    }

    const parsed = extractJson(content) as Partial<ClinicalAssessment>;
    return mergeAssessments(localAssessment, parsed);
  } catch (error) {
    console.warn('Falha ao analisar com Groq. Mantendo análise local.', error);
    return localAssessment;
  }
}
