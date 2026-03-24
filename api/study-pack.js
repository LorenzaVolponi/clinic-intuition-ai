import { z } from 'zod';
import crypto from 'node:crypto';

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
        'Você é um tutor médico sênior para app mobile. Gere SOMENTE JSON válido com meta{topic,generated_at,safety_warning}, lessons[10], flashcards[min5] (id,front,back) e quiz[min7] (id,difficulty,scenario,question,options A-D,correct_option_id,explanation). Sem alucinação e sem texto fora do JSON.',
    },
    { role: 'user', content: `Tema: ${topicId}. Gere conteúdo didático objetivo, factual e conservador para mobile.` },
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
    meta: {
      topic: topicId,
      generated_at: new Date().toISOString(),
      safety_warning: topicId === 'emergencias',
    },
    topicId,
    generatedAt: new Date().toISOString(),
    lessons,
    quiz,
    flashcards: Array.from({ length: 10 }, (_, idx) => ({
      id: `${topicId}-flashcard-${idx + 1}`,
      front: `Flashcard ${idx + 1}: ${shuffle(base.stems)[0]}`,
      back: shuffle(base.lessons)[0],
      question: `Flashcard ${idx + 1}: ${shuffle(base.stems)[0]}`,
      answer: shuffle(base.lessons)[0],
      hint: 'Relacione com red flags e conduta inicial.',
    })),
  };
}

function normalizePack(topicId, aiPack) {
  const quiz = (aiPack.quiz || []).map((item, index) => {
    const options = (item.options || []).map((opt) => (typeof opt === 'string' ? opt : opt.text));
    const correctOption = (item.options || []).find((opt) => typeof opt !== 'string' && opt.id === item.correct_option_id);
    const answer = item.answer || correctOption?.text || options[0] || 'Resposta indisponível';
    const scenario = item.scenario || '';
    const hash = crypto.createHash('sha256').update(`${scenario}:${item.question}`).digest('hex').slice(0, 12);
    return {
      id: item.id || `${topicId}-quiz-${index + 1}`,
      hash,
      difficulty: item.difficulty || (index % 3 === 0 ? 'easy' : index % 3 === 1 ? 'medium' : 'hard'),
      scenario,
      question: item.scenario ? `${item.scenario}\n\n${item.question}` : item.question,
      options,
      optionObjects: (item.options || []).map((opt, idx) => (typeof opt === 'string' ? { id: ['A', 'B', 'C', 'D'][idx], text: opt } : opt)),
      correct_option_id: item.correct_option_id || 'A',
      answer,
      explanation: item.explanation,
    };
  }).filter((item, index, arr) => arr.findIndex((other) => other.hash === item.hash) === index)
    .map(({ hash: _hash, ...rest }) => rest);

  const flashcards = (aiPack.flashcards || []).map((card, index) => ({
    id: card.id || `${topicId}-flashcard-${index + 1}`,
    front: card.front || card.question || 'Conceito clínico',
    back: card.back || card.answer || 'Revisar protocolos e red flags.',
    question: card.question || card.front || 'Conceito clínico',
    answer: card.answer || card.back || 'Revisar protocolos e red flags.',
    hint: card.hint || 'Associe com sinais de gravidade e conduta inicial.',
  }));

  return {
    meta: aiPack.meta || { topic: topicId, generated_at: new Date().toISOString(), safety_warning: topicId === 'emergencias' },
    topicId: aiPack.topicId || aiPack.meta?.topic || topicId,
    generatedAt: aiPack.generatedAt || aiPack.meta?.generated_at || new Date().toISOString(),
    lessons: (aiPack.lessons || []).map((lesson) => ({
      title: lesson.title,
      content: lesson.content,
      topicId: lesson.topicId || topicId,
    })),
    quiz,
    flashcards,
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
    aiPack.quiz.length >= 7 &&
    Array.isArray(aiPack.flashcards) &&
    aiPack.flashcards.length >= 5
  ) {
    return res.status(200).json(normalizePack(parsed.data.topicId, aiPack));
  }

  return res.status(200).json(buildLocalPack(parsed.data.topicId));
}
