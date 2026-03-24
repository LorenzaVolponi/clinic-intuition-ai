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
    content: `${shuffle(base.lessons)[0]} Foco em segurança clínica e revisão ativa.`,
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

  return res.status(200).json(buildLocalPack(parsed.data.topicId));
}
