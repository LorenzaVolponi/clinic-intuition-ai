import crypto from 'node:crypto';
import { buildMedbotLocalContent } from '../shared/medbotLocal.js';

const MEDBOT_SYSTEM_PROMPT = `# ⚕️ MEDBOT
Responda APENAS em JSON no formato:
{"response":{"session_id":"string","interaction_id":"string","timestamp":"ISO8601","user_level":"iniciante|intermediario|avancado","intent":"resumo|caso|quiz|medicamento|comparacao|duvida","content":{"text":"markdown","type":"text|case|quiz|medication","metadata":{"topic":"string","sources":["string"],"difficulty":"easy|medium|hard","estimated_read_time":90}},"suggestions":["string"],"session_state":{"total_interactions":1,"topics_covered":["string"],"used_ids":["string"]}}}`;

const sessionCache = new Map();
const TTL_MS = 24 * 60 * 60 * 1000;

function getSessionState(sessionId) {
  const now = Date.now();
  const existing = sessionCache.get(sessionId);
  if (existing && now - existing.lastAccessed < TTL_MS) {
    existing.lastAccessed = now;
    return existing;
  }
  const next = { interactions: [], topics: new Set(), usedIds: new Set(), userLevel: 'intermediario', lastAccessed: now };
  sessionCache.set(sessionId, next);
  return next;
}

function buildLocalResponse({ topicId, question, history = [], sessionUuid, userLevel = 'intermediario', context = {} }) {
  const interactionId = crypto.randomUUID();
  const { intent, text, suggestions, difficulty } = buildMedbotLocalContent({
    topicId,
    question,
    history,
    objective: context?.objective,
    quickFacts: context?.quickFacts,
    clinicalSummary: context?.clinicalSummary,
    userLevel,
    source: 'local',
  });

  return {
    response: {
      session_id: sessionUuid,
      interaction_id: interactionId,
      timestamp: new Date().toISOString(),
      user_level: userLevel,
      intent,
      content: {
        text,
        type: intent === 'quiz' ? 'quiz' : intent === 'caso' ? 'case' : intent === 'medicamento' ? 'medication' : 'text',
        metadata: {
          topic: topicId,
          sources: ['Consenso educacional local 2026'],
          difficulty,
          estimated_read_time: 90,
        },
      },
      suggestions,
      session_state: { total_interactions: 1, topics_covered: [topicId], used_ids: [interactionId] },
    },
  };
}

async function callGroq(messages) {
  const apiKey = process.env.GROQ_API_KEY;
  const preferredModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const models = [preferredModel, 'llama-3.1-70b-versatile', 'llama-3.1-8b-instant'];

  if (!apiKey) throw new Error('Backend de IA não configurado.');

  let lastError = 'Erro desconhecido ao chamar Groq.';
  for (const model of models) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, temperature: 0.2, top_p: 0.5, response_format: { type: 'json_object' }, messages }),
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
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { topicId, question, history = [], context = {}, userLevel = 'intermediario' } = req.body || {};
  const sessionUuid = req.headers['x-session-uuid'] || crypto.randomUUID();

  if (!topicId || !question || String(question).trim().length === 0) return res.status(400).json({ error: 'Payload inválido.' });

  const sessionState = getSessionState(sessionUuid);
  sessionState.userLevel = userLevel;
  sessionState.topics.add(topicId);

  const fallback = buildLocalResponse({ topicId, question, history, sessionUuid, userLevel, context });
  sessionState.interactions.push(fallback.response.interaction_id);
  sessionState.usedIds.add(fallback.response.interaction_id);
  fallback.response.session_state = {
    total_interactions: sessionState.interactions.length,
    topics_covered: [...sessionState.topics],
    used_ids: [...sessionState.usedIds],
  };

  if (!process.env.GROQ_API_KEY) {
    return res.status(200).json({ answer: fallback.response.content.text, response: fallback.response, suggestions: fallback.response.suggestions, intent: fallback.response.intent, source: 'local' });
  }

  try {
    const historyText = history.slice(-6).map((item) => `${item.role}: ${item.content}`).join('\n');
    const contextText = `Objetivo: ${context.objective || 'não informado'}\nPontos-chave: ${(context.quickFacts || []).join(' | ') || 'não informado'}\nResumo clínico: ${context.clinicalSummary || 'não informado'}`;
    const response = await callGroq([
      { role: 'system', content: MEDBOT_SYSTEM_PROMPT },
      { role: 'user', content: `Tema: ${topicId}\nNível: ${userLevel}\nContexto:\n${contextText}\nHistórico recente:\n${historyText || 'Sem histórico'}\nPergunta atual: ${question}\nSession UUID: ${sessionUuid}` },
    ]);

    const normalized = response?.response?.content?.text ? response.response : fallback.response;
    return res.status(200).json({ answer: normalized.content.text, response: normalized, suggestions: normalized.suggestions, intent: normalized.intent, source: 'groq' });
  } catch {
    return res.status(200).json({ answer: fallback.response.content.text, response: fallback.response, suggestions: fallback.response.suggestions, intent: fallback.response.intent, source: 'local' });
  }
}
