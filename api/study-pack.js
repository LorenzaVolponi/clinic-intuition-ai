import { z } from 'zod';

const requestSchema = z.object({
  topicId: z.string().min(1),
});

const localLibrary = {
  emergencias: {
    lessons: [
      'ABCDE antes de aprofundar hipóteses.',
      'Dor torácica + dispneia = prioridade alta.',
      'Reavaliar sinais vitais após intervenções.',
    ],
    stems: ['Qual exame inicial é obrigatório na dor torácica?', 'Qual red flag muda triagem imediatamente?'],
  },
  cardiologia: {
    lessons: ['ECG e troponina em série orientam conduta.', 'Dispneia pode ser equivalente anginoso.', 'B3 sugere sobrecarga ventricular.'],
    stems: ['Quando suspeitar de SCA?', 'Qual achado sugere IC descompensada?'],
  },
  infectologia: {
    lessons: ['Critérios de gravidade definem local de tratamento.', 'Sepse exige reconhecimento precoce.', 'Pielonefrite difere de ITU baixa por sinais sistêmicos.'],
    stems: ['Qual sinal agrava pneumonia?', 'Quando considerar sepse?'],
  },
  neurologia: {
    lessons: ['Déficit focal súbito é AVC até prova em contrário.', 'Glicemia capilar é obrigatória.', 'Último bem define janela terapêutica.'],
    stems: ['Qual exame simples evita mimetizador de AVC?', 'Qual dado temporal é crítico no AVC agudo?'],
  },
};

async function callGroq(topicId) {
  const apiKey = process.env.GROQ_API_KEY;
  const preferredModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const models = [preferredModel, 'llama-3.1-70b-versatile', 'llama-3.1-8b-instant'];

  if (!apiKey) return null;

  const messages = [
    {
      role: 'system',
      content:
        'Você é um tutor médico educacional. Gere SOMENTE JSON com topicId, generatedAt, lessons[10], quiz[10], flashcards[10]. Cada lesson: title e content. Cada quiz: question, options(4), answer, explanation. Cada flashcard: question, answer, hint.',
    },
    { role: 'user', content: `Tema: ${topicId}. Gere conteúdo didático objetivo, factual e conservador.` },
  ];

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

    if (!response.ok) continue;
    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) continue;
    try {
      return JSON.parse(content);
    } catch {
      continue;
    }
  }

  return null;
}

function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildLocalPack(topicId) {
  const base = localLibrary[topicId] || localLibrary.emergencias;
  const lessons = Array.from({ length: 10 }, (_, idx) => ({
    title: `Aula ${idx + 1} • ${topicId}`,
    content: `Objetivo: ${shuffle(base.lessons)[0]}\nConceitos-chave: red flags, hipótese principal, diferenciais críticos.\nChecklist: sinais vitais, exame físico dirigido, exames iniciais e reavaliação.`,
    topicId,
  }));

  const correct = 'Priorizar avaliação clínica, sinais de alarme e exames iniciais.';
  const quiz = Array.from({ length: 10 }, (_, idx) => ({
    question: `${shuffle(base.stems)[0]} (Q${idx + 1})`,
    options: shuffle([
      correct,
      'Aguardar sem monitorização.',
      'Ignorar sintomas e focar só em exame tardio.',
      'Confirmar diagnóstico sem reavaliar.',
    ]),
    answer: correct,
    explanation: 'A tomada de decisão segura prioriza risco, red flags e confirmação progressiva.',
  }));

  return {
    topicId,
    generatedAt: new Date().toISOString(),
    lessons,
    quiz,
    flashcards: Array.from({ length: 10 }, (_, idx) => ({
      question: `Flashcard ${idx + 1}: ${shuffle(base.stems)[0]}`,
      answer: shuffle(base.lessons)[0],
      hint: 'Relacione com red flags e conduta inicial.',
    })),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Payload inválido.', details: parsed.error.flatten() });
  }

  const aiPack = await callGroq(parsed.data.topicId);
  if (
    aiPack &&
    Array.isArray(aiPack.lessons) &&
    aiPack.lessons.length >= 10 &&
    Array.isArray(aiPack.quiz) &&
    aiPack.quiz.length >= 10 &&
    Array.isArray(aiPack.flashcards) &&
    aiPack.flashcards.length >= 10
  ) {
    return res.status(200).json({
      topicId: aiPack.topicId || parsed.data.topicId,
      generatedAt: aiPack.generatedAt || new Date().toISOString(),
      lessons: aiPack.lessons.slice(0, 10),
      quiz: aiPack.quiz.slice(0, 10),
      flashcards: aiPack.flashcards.slice(0, 10),
    });
  }

  return res.status(200).json(buildLocalPack(parsed.data.topicId));
}
