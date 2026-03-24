import { MEDBOT_SYSTEM_PROMPT } from '../backend/prompts.js';

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { topicId, question, history = [] } = req.body || {};

  if (!topicId || !question) {
    return res.status(400).json({ error: 'Payload inválido.' });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ error: 'Backend de IA não configurado.' });
  }

  try {
    const historyText = history.slice(-6).map((item) => `${item.role}: ${item.content}`).join('\n');
    const response = await callGroq([
      { role: 'system', content: MEDBOT_SYSTEM_PROMPT },
      { role: 'user', content: `Tema: ${topicId}\nHistórico recente:\n${historyText || 'Sem histórico'}\nPergunta atual: ${question}` },
    ]);

    return res.status(200).json({ answer: response.answer || 'Resposta indisponível.', source: 'groq' });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Erro inesperado no backend.' });
  }
}
