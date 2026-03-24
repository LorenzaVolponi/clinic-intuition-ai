const MEDBOT_SYSTEM_PROMPT = `
Você é um tutor médico educacional.
- Responda em JSON: {"answer":"..."}.
- Seja conservador, factual e orientado a segurança clínica.
`;

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { topicId, question, history = [], context = {} } = req.body || {};

  if (!topicId || !question) {
    return res.status(400).json({ error: 'Payload inválido.' });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(200).json({
      answer: 'Modo local ativo: revise red flags, hipótese principal, diferenciais críticos e exames iniciais.',
      source: 'local',
    });
  }

  try {
    const historyText = history.slice(-6).map((item) => `${item.role}: ${item.content}`).join('\n');
    const contextText = `Objetivo: ${context.objective || 'não informado'}\nPontos-chave: ${(context.quickFacts || []).join(' | ') || 'não informado'}\nResumo clínico: ${context.clinicalSummary || 'não informado'}`;
    const response = await callGroq([
      { role: 'system', content: MEDBOT_SYSTEM_PROMPT },
      { role: 'user', content: `Tema: ${topicId}\nContexto:\n${contextText}\nHistórico recente:\n${historyText || 'Sem histórico'}\nPergunta atual: ${question}` },
    ]);

    return res.status(200).json({ answer: response.answer || 'Resposta indisponível.', source: 'groq' });
  } catch (error) {
    return res.status(200).json({
      answer: 'Falha temporária da IA externa. Continue com revisão local estruturada por sinais de alarme e conduta inicial.',
      source: 'local',
    });
  }
}
