import crypto from 'node:crypto';

const MEDBOT_SYSTEM_PROMPT = `
Você é um tutor médico educacional com isolamento por sessão.
- Responda em JSON: {"answer":"...","session_metadata":{"session_uuid":"...","interaction_number":0,"timestamp":"ISO8601"}}.
- Seja conservador, factual e orientado a segurança clínica.
- Use apenas contexto da sessão atual.
`;

function buildLocalMedbotAnswer({ topicId, question, context = {}, source = 'local', sessionUuid = 'sessao-local' }) {
  const objective = context.objective || 'Reforçar raciocínio clínico seguro.';
  const facts = (context.quickFacts || []).slice(0, 3);
  const normalized = String(question || '').toLowerCase();

  if (normalized.includes('plano') || normalized.includes('cronograma')) {
    return `[Modo: ${source === 'local' ? 'Offline' : 'Online'} | Sessão: ${sessionUuid}]\n[Contexto: Revisão]\n\nPlano (${topicId}):\n• Objetivo: ${objective}\n• Revisar: ${facts.join(' | ') || 'red flags e exames iniciais'}\n• Resolver 10 questões\n\nFONTE: ${source === 'local' ? 'LOCAL' : 'GROQ'}`;
  }

  if (normalized.includes('anamnese') || normalized.includes('caso')) {
    return `[Modo: ${source === 'local' ? 'Offline' : 'Online'} | Sessão: ${sessionUuid}]\n[Contexto: Revisão clínica]\n\nAnamnese guiada (${topicId}):\n• queixa principal\n• tempo de evolução\n• **red flags**\n• diferenciais críticos\n• exames que mudam conduta\n\nFONTE: ${source === 'local' ? 'LOCAL' : 'GROQ'}`;
  }

  return `[Modo: ${source === 'local' ? 'Offline' : 'Online'} | Sessão: ${sessionUuid}]\n[Contexto: Revisão]\n\nResumo (${topicId}): objetivo "${objective}". Pontos-chave: ${
    facts.join(' | ') || 'hipótese principal, red flags, exames iniciais'
  }.\n\nFONTE: ${source === 'local' ? 'LOCAL' : 'GROQ'}`;
}

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
  const sessionUuid = req.headers['x-session-uuid'] || crypto.randomUUID();
  const interactionNumber = Number(req.headers['x-interaction-number'] || 1);

  if (!topicId || !question) {
    return res.status(400).json({ error: 'Payload inválido.' });
  }

  if (!process.env.GROQ_API_KEY) {
    return res.status(200).json({
      answer: buildLocalMedbotAnswer({ topicId, question, context, source: 'local', sessionUuid }),
      source: 'local',
      session_metadata: { session_uuid: sessionUuid, interaction_number: interactionNumber, timestamp: new Date().toISOString() },
    });
  }

  try {
    const historyText = history.slice(-6).map((item) => `${item.role}: ${item.content}`).join('\n');
    const contextText = `Objetivo: ${context.objective || 'não informado'}\nPontos-chave: ${(context.quickFacts || []).join(' | ') || 'não informado'}\nResumo clínico: ${context.clinicalSummary || 'não informado'}`;
    const response = await callGroq([
      { role: 'system', content: MEDBOT_SYSTEM_PROMPT },
      { role: 'user', content: `Tema: ${topicId}\nContexto:\n${contextText}\nHistórico recente:\n${historyText || 'Sem histórico'}\nPergunta atual: ${question}` },
    ]);

    return res.status(200).json({
      answer: response.answer || 'Resposta indisponível.',
      source: 'groq',
      session_metadata: response.session_metadata || { session_uuid: sessionUuid, interaction_number: interactionNumber, timestamp: new Date().toISOString() },
    });
  } catch (error) {
    return res.status(200).json({
      answer: buildLocalMedbotAnswer({ topicId, question, context, source: 'local', sessionUuid }),
      source: 'local',
      session_metadata: { session_uuid: sessionUuid, interaction_number: interactionNumber, timestamp: new Date().toISOString() },
    });
  }
}
