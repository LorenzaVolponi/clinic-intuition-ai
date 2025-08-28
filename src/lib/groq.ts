import { PatientData, DiagnosisData } from '@/types';
import { generateClinicalPrompt } from './medicalKnowledge';

export async function getDiagnosisFromGroq(patient: PatientData): Promise<DiagnosisData> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ API key not configured');
  }

  const prompt = generateClinicalPrompt(patient) +
    "\n\nResponda estritamente em JSON no formato: {\"hypotheses\":[{\"name\":\"\",\"probability\":\"\",\"treatment\":\"\",\"explanation\":\"\",\"differentials\":[]}],\"emergencyWarning\":\"\"}";

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'Você é um assistente médico. Responda em português.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0,
      top_p: 1
    })
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();

  try {
    return JSON.parse(content);
  } catch {
    return {
      hypotheses: [
        {
          name: 'Análise indisponível',
          probability: 'Indefinido',
          treatment: 'Não foi possível obter análise do modelo',
          explanation: content || 'Sem resposta',
          differentials: []
        }
      ]
    };
  }
}
