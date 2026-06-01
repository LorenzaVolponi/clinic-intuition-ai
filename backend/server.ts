import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import { z } from 'zod';
import { buildClinicalUserPrompt, CLINICAL_SYSTEM_PROMPT, MEDBOT_SYSTEM_PROMPT, QUICK_LESSON_SYSTEM_PROMPT, STUDY_PACK_SYSTEM_PROMPT } from './prompts';
import { validateClinicalResponse, type BackendClinicalModelResponse } from './validators';
import { extractCaseFacts } from './clinical-safety/parser';
import { mergeClinicalWithFallback } from '../shared/clinicalResponse.js';
import { buildMedbotLocalContent } from '../shared/medbotLocal.js';
import { getTopicReferences } from '../shared/clinicalReferences.js';
import { isMedbotAnswerSafe } from '../shared/medbotSafety.js';
import { getEvidenceBrief, getEvidenceCatalog, getEvidenceStatus, refreshEvidenceFromSources, searchEvidence } from './evidenceAgent';

dotenv.config();

const port = Number(process.env.BACKEND_PORT || 8787);
const groqApiKey = process.env.GROQ_API_KEY?.trim();
const preferredModel = process.env.GROQ_MODEL?.trim() || 'llama-3.3-70b-versatile';
const modelFallbackChain = [preferredModel, 'llama-3.1-70b-versatile', 'llama-3.1-8b-instant'];
const SESSION_STORE_FILE = process.env.SESSION_STORE_FILE || '/tmp/medinnova-session-cache.json';

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

const medbotRequestSchema = z.object({
  topicId: z.string(),
  question: z.string().min(1),
  history: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })).optional(),
  userLevel: z.enum(['iniciante', 'intermediario', 'avancado']).optional(),
  context: z
    .object({
      objective: z.string().optional(),
      quickFacts: z.array(z.string()).optional(),
      clinicalSummary: z.string().optional(),
      userLevel: z.enum(['iniciante', 'intermediario', 'avancado']).optional(),
    })
    .optional(),
});

const studyPackRequestSchema = z.object({
  topicId: z.string().min(1),
  objective: z.string().max(500).optional(),
  focus: z.enum(['all', 'flashcards', 'quiz', 'lessons']).optional(),
  nonce: z.string().max(100).optional(),
});

type LocalAssessment = z.infer<typeof localAssessmentSchema>;

type GroqContentResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

type SessionData = {
  sessionUuid: string;
  userId: string;
  timestamp: string;
  interactionNumber: number;
};

type MedbotIntent = 'resumo' | 'caso' | 'quiz' | 'medicamento' | 'comparacao' | 'duvida';

declare module 'express-serve-static-core' {
  interface Request {
    sessionData?: SessionData;
  }
}

const clinicalModelResponseSchema = z.object({
  triageLevel: z.enum(['Eletivo', 'Urgência', 'Emergência']),
  triageReason: z.string(),
  educationalWarning: z.string(),
  hypotheses: z.array(
    z.object({
      name: z.string(),
      role: z.enum(['mais provável', 'mais grave a excluir', 'diferencial comum']),
      probability: z.enum(['Alta', 'Moderada', 'Média', 'Baixa']),
      confidenceScore: z.number().min(0).max(100),
      justification: z.string(),
      physiopathology: z.string(),
      differentials: z.array(z.string()),
      exams: z.array(z.string()),
    }),
  ),
  investigationPlan: z.object({
    immediate: z.array(z.string()),
    complementary: z.array(z.string()),
    specialAttention: z.array(z.string()),
  }),
  conduct: z.object({
    immediateActions: z.array(z.string()),
    monitoring: z.array(z.string()),
    legalNotice: z.string(),
  }),
});

const medbotModelResponseSchema = z.object({
  response: z.object({
    session_id: z.string(),
    interaction_id: z.string(),
    timestamp: z.string(),
    user_level: z.enum(['iniciante', 'intermediario', 'avancado']),
    intent: z.enum(['resumo', 'caso', 'quiz', 'medicamento', 'comparacao', 'duvida']),
    content: z.object({
      text: z.string().min(1),
      type: z.enum(['text', 'case', 'quiz', 'medication']),
      metadata: z.object({
        topic: z.string(),
        sources: z.array(z.string()),
        difficulty: z.enum(['easy', 'medium', 'hard']),
        estimated_read_time: z.number(),
      }),
    }),
    suggestions: z.array(z.string()).min(1),
    session_state: z.object({
      total_interactions: z.number(),
      topics_covered: z.array(z.string()),
      used_ids: z.array(z.string()),
    }),
  }),
});

const studyPackModelResponseSchema = z.object({
  meta: z
    .object({
      topic: z.string(),
      generated_at: z.string(),
      safety_warning: z.boolean().optional(),
    })
    .optional(),
  topicId: z.string().optional(),
  generatedAt: z.string().optional(),
  lessons: z
    .array(
      z.union([
        z.object({ title: z.string(), content: z.string(), topicId: z.string().optional() }),
        z.object({
          aula_rapida: z.object({
            id: z.string().optional(),
            topico: z.string(),
            tempo_estimado_leitura: z.string().optional(),
            nivel: z.string().optional(),
            '1_gancho_clinico': z.object({ descricao: z.string(), pergunta_provocativa: z.string() }).optional(),
            '2_explicacao_direta': z
              .object({
                conceito_chave: z.string(),
                fisiopatologia_simplificada: z.string().optional(),
                pontos_essenciais: z.array(z.string()).optional(),
              })
              .optional(),
            '5_red_flags': z
              .object({
                flags: z.array(z.object({ sinal: z.string(), por_que_grave: z.string(), conduta_imediata: z.string() })).optional(),
              })
              .optional(),
            '7_resumo_bolso': z.object({ frase_unico: z.string().optional(), fluxograma_simplificado: z.array(z.string()).optional() }).optional(),
          }),
        }),
      ]),
    )
    .optional(),
  flashcards: z
    .array(
      z
        .object({
          id: z.string().optional(),
          front: z.string().optional(),
          back: z.string().optional(),
          question: z.string().optional(),
          answer: z.string().optional(),
          hint: z.string().optional(),
        })
        .refine((item) => Boolean(item.front || item.question), 'flashcard precisa de front/question')
        .refine((item) => Boolean(item.back || item.answer), 'flashcard precisa de back/answer'),
    )
    .min(1)
    .optional(),
  quiz: z.array(
    z.object({
      id: z.string().optional(),
      difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
      scenario: z.string().optional(),
      question: z.string(),
      options: z.array(z.union([z.string(), z.object({ id: z.enum(['A', 'B', 'C', 'D']), text: z.string() })])).min(2),
      correct_option_id: z.enum(['A', 'B', 'C', 'D']).optional(),
      answer: z.string().optional(),
      explanation: z.string(),
    }),
  ).min(1).optional(),
});

const studyPackLocalLibrary: Record<string, { lessons: string[]; questions: string[] }> = {
  emergencias: {
    lessons: [
      'Priorize ABCDE e estabilização antes de aprofundar diagnósticos.',
      'Dor torácica + sudorese + dispneia deve ser tratada como urgência.',
      'Sinais de choque mudam prioridade e local de atendimento.',
      'Tempo de início em AVC define oportunidades terapêuticas.',
      'Reavalie continuamente sinais vitais após cada intervenção.',
    ],
    questions: ['Qual a prioridade inicial em dor torácica instável?', 'Qual red flag respiratória exige intervenção imediata?'],
  },
  cardiologia: {
    lessons: [
      'ECG precoce e interpretação contextual mudam conduta em dor torácica.',
      'Troponina deve ser analisada em série e junto da história clínica.',
      'Dispneia pode ser equivalente anginoso em grupos específicos.',
      'IC descompensada exige avaliação de congestão e perfusão.',
      'Red flags hemodinâmicas redefinem prioridade de atendimento.',
    ],
    questions: ['Qual exame inicial não pode faltar na dor torácica?', 'Qual sinal clínico sugere IC descompensada?'],
  },
  infectologia: {
    lessons: [
      'Estratificação de gravidade em síndrome febril orienta local de tratamento.',
      'Pneumonia com hipoxemia/confusão exige maior vigilância.',
      'Sepse é reconhecimento de infecção com disfunção orgânica.',
      'Diferenciar ITU baixa de pielonefrite muda antibiótico e seguimento.',
      'Tempo de antibiótico em quadros graves impacta desfecho.',
    ],
    questions: ['Qual critério sugere gravidade em pneumonia?', 'Qual tríade sugere pielonefrite?'],
  },
  neurologia: {
    lessons: [
      'Déficit focal súbito deve ser tratado como AVC até exclusão.',
      'Glicemia capilar é passo obrigatório no déficit neurológico agudo.',
      'Cefaleia com sinais de alarme exige investigação urgente.',
      'Hora do último bem define elegibilidade para terapias tempo-dependentes.',
      'Reavaliação neurológica seriada reduz atraso diagnóstico.',
    ],
    questions: ['Qual exame rápido evita mimetizador de AVC?', 'Qual dado temporal é essencial no AVC agudo?'],
  },
};

function sanitizeEducationalText(text: string) {
  return text
    .replace(/\b\d+([.,]\d+)?\s?(mg|g|mcg|µg|ml|mL)\b/gi, '[dose conforme protocolo]')
    .replace(/\b\d+\s?\/\s?\d+\s?h\b/gi, '[intervalo conforme protocolo]')
    .trim();
}

function applyStudyPackFocus(
  pack: ReturnType<typeof buildLocalStudyPack>,
  focus: 'all' | 'flashcards' | 'quiz' | 'lessons' = 'all',
) {
  if (focus === 'flashcards') return { ...pack, lessons: [], quiz: [] };
  if (focus === 'quiz') return { ...pack, lessons: [], flashcards: [] };
  if (focus === 'lessons') return { ...pack, quiz: [], flashcards: [] };
  return pack;
}

function buildLocalStudyPack(topicId: string, objective?: string, nonce?: string) {
  const base = studyPackLocalLibrary[topicId] ?? studyPackLocalLibrary.emergencias;
  const nonceSuffix = String(nonce || Date.now()).slice(-6);
  const objectiveLine = objective ? `Objetivo da pessoa: ${objective}` : 'Objetivo da pessoa: revisão prática guiada.';
  const objectiveSnippet = sanitizeEducationalText(objectiveLine.replace('Objetivo da pessoa: ', '').slice(0, 120));
  const shift = [...nonceSuffix].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const pickByIndex = <T,>(items: T[], index: number) => items[(index + shift) % items.length];

  const lessons = Array.from({ length: 10 }, (_, index) => ({
    title: `Aula ${index + 1} • ${topicId} • ${nonceSuffix}`,
    content: sanitizeEducationalText(
      `${objectiveLine}\n${pickByIndex(base.lessons, index)} Foco: segurança clínica, exames iniciais e tomada de decisão.\nInterativo: finalize com uma pergunta de checagem.`,
    ),
    topicId,
  }));

  const quiz = Array.from({ length: 10 }, (_, index) => {
    const stem = pickByIndex(base.questions, index);
    const correct = 'Priorizar avaliação presencial e conduta baseada em sinais de alarme.';
    const distractors = [
      'Aguardar evolução sem monitorização.',
      'Ignorar sinais vitais e focar apenas em exames tardios.',
      'Concluir diagnóstico definitivo sem reavaliação clínica.',
    ];
    const orderedDistractors = [
      pickByIndex(distractors, index),
      pickByIndex(distractors, index + 1),
      pickByIndex(distractors, index + 2),
    ];

    return {
      question: `${stem} • foco: ${objectiveSnippet} (Pergunta ${index + 1} • ${nonceSuffix})`,
      options: [correct, ...orderedDistractors].sort((a, b) => (a + nonceSuffix).localeCompare(b + nonceSuffix)),
      answer: correct,
      explanation: sanitizeEducationalText(
        `Condutas clínicas devem priorizar estabilidade, red flags e confirmação diagnóstica progressiva. Contexto do objetivo: ${objectiveSnippet}.`,
      ),
    };
  });

  return {
    meta: {
      topic: topicId,
      generated_at: new Date().toISOString(),
      safety_warning: topicId === 'emergencias',
    },
    topicId,
    generatedAt: new Date().toISOString(),
    lessons,
    flashcards: Array.from({ length: 10 }, (_, index) => ({
      id: `${topicId}-flashcard-${index + 1}-${nonceSuffix}`,
      front: sanitizeEducationalText(`Flashcard ${index + 1} • ${topicId}: ${pickByIndex(base.questions, index)} (${nonceSuffix})`),
      back: sanitizeEducationalText(`${pickByIndex(base.lessons, index)}\nObjetivo aplicado: ${objectiveSnippet}.`),
      question: sanitizeEducationalText(`Flashcard ${index + 1} • ${topicId}: ${pickByIndex(base.questions, index + 1)} • foco ${objectiveSnippet} (${nonceSuffix})`),
      answer: sanitizeEducationalText(`${pickByIndex(base.lessons, index + 1)}\nContexto de estudo: ${objectiveSnippet}.`),
      hint: `Relacione o conceito com red flags e decisão inicial. Objetivo atual: ${objectiveSnippet}.`,
    })),
    quiz,
  };
}

function normalizeStudyPackForClient(topicId: string, payload: z.infer<typeof studyPackModelResponseSchema>) {
  const fallbackPack = buildLocalStudyPack(topicId);
  const rawQuiz = payload.quiz || [];
  const rawFlashcards = payload.flashcards || [];
  type QuizItem = NonNullable<z.infer<typeof studyPackModelResponseSchema>['quiz']>[number];
  const optionsFrom = (item: QuizItem) => {
    return item.options.map((option) => (typeof option === 'string' ? option : option.text));
  };

  const answerFrom = (item: QuizItem) => {
    if (item.answer) return item.answer;
    if (!item.correct_option_id) return optionsFrom(item)[0] || 'Resposta indisponível';
    const matched = item.options.find((opt) => typeof opt !== 'string' && opt.id === item.correct_option_id);
    return typeof matched === 'string' ? matched : matched?.text || optionsFrom(item)[0] || 'Resposta indisponível';
  };

  const quizItems = rawQuiz
    .map((item, index) => {
      const options = optionsFrom(item);
      const answer = answerFrom(item);
      const scenario = item.scenario || '';
      const hash = crypto.createHash('sha256').update(`${scenario}:${item.question}`).digest('hex').slice(0, 12);

      return {
        id: item.id || `${topicId}-quiz-${index + 1}-${hash}`,
        hash,
        difficulty: item.difficulty || (index % 3 === 0 ? 'easy' : index % 3 === 1 ? 'medium' : 'hard'),
        scenario,
        question: item.scenario ? `${item.scenario}\n\n${item.question}` : item.question,
        options: options.map((option) => sanitizeEducationalText(option)),
        optionObjects: item.options.map((opt, idx) =>
          typeof opt === 'string' ? { id: String.fromCharCode(65 + idx) as 'A' | 'B' | 'C' | 'D', text: opt } : opt,
        ),
        correct_option_id:
          item.correct_option_id ||
          (item.options.find((opt) => (typeof opt === 'string' ? opt === answer : opt.text === answer)) &&
            (item.options.find((opt) => (typeof opt === 'string' ? opt === answer : opt.text === answer)) as { id?: 'A' | 'B' | 'C' | 'D' }).id) ||
          'A',
        answer: sanitizeEducationalText(answer),
        explanation: sanitizeEducationalText(item.explanation),
      };
    })
    .filter((item, index, arr) => arr.findIndex((other) => other.hash === item.hash) === index)
    .map(({ hash: _hash, ...rest }) => rest);

  const uniqueLessons = (payload.lessons?.map((lesson, index) => {
    if ('title' in lesson) {
      return {
        title: lesson.title,
        content: lesson.content,
        topicId: lesson.topicId || topicId,
      };
    }
    const aula = lesson.aula_rapida;
    return {
        title: `Aula rápida ${index + 1} • ${aula.topico}`,
      content: sanitizeEducationalText(`Gancho: ${aula['1_gancho_clinico']?.descricao || 'Caso clínico rápido.'}\nConceito: ${aula['2_explicacao_direta']?.conceito_chave || 'Revisão objetiva.'}\nPontos essenciais: ${
        aula['2_explicacao_direta']?.pontos_essenciais?.join(' | ') || 'Sem pontos adicionais.'
      }\nRed flags: ${
        aula['5_red_flags']?.flags?.map((flag) => `${flag.sinal} (${flag.conduta_imediata})`).join(' | ') || 'Sem red flags destacadas.'
      }\nResumo de bolso: ${aula['7_resumo_bolso']?.frase_unico || 'Aplicar raciocínio clínico seguro.'}`),
      topicId,
    };
  }) || []).filter((lesson, index, arr) => arr.findIndex((other) => other.title === lesson.title && other.content === lesson.content) === index);

  const uniqueFlashcards = rawFlashcards
    .map((card, index) => ({
      id: card.id || `${topicId}-flashcard-${index + 1}`,
      front: sanitizeEducationalText(card.front || card.question || 'Conceito clínico'),
      back: sanitizeEducationalText(card.back || card.answer || 'Revisar protocolos e red flags.'),
      question: sanitizeEducationalText(card.question || card.front || 'Conceito clínico'),
      answer: sanitizeEducationalText(card.answer || card.back || 'Revisar protocolos e red flags.'),
      hint: card.hint || 'Associe com sinais de gravidade e conduta inicial.',
    }))
    .filter((card, index, arr) => arr.findIndex((other) => other.question === card.question && other.answer === card.answer) === index);

  const mergedLessons = [...uniqueLessons, ...fallbackPack.lessons].slice(0, 10);
  const mergedFlashcards = [...uniqueFlashcards, ...fallbackPack.flashcards].slice(0, 10);
  const mergedQuiz = [...quizItems, ...fallbackPack.quiz].slice(0, 10);

  return {
    meta: payload.meta ?? {
      topic: topicId,
      generated_at: payload.generatedAt || new Date().toISOString(),
      safety_warning: topicId === 'emergencias',
    },
    topicId: payload.topicId || payload.meta?.topic || topicId,
    generatedAt: payload.generatedAt || payload.meta?.generated_at || new Date().toISOString(),
    lessons: mergedLessons,
    flashcards: mergedFlashcards,
    quiz: mergedQuiz,
  };
}

async function callGroq(messages: Array<{ role: 'system' | 'user'; content: string }>) {
  if (!groqApiKey) {
    throw new Error('Backend IA não configurado. Defina GROQ_API_KEY.');
  }

  let lastError = 'Falha desconhecida.';

  for (const model of modelFallbackChain) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    let response: Response;
    try {
      response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          top_p: 0.5,
          response_format: { type: 'json_object' },
          messages,
        }),
        signal: controller.signal,
      });
    } catch (error) {
      lastError = `Groq timeout/network error (${model}): ${(error as Error).message}`;
      clearTimeout(timeout);
      continue;
    }
    clearTimeout(timeout);

    if (!response.ok) {
      lastError = `Groq ${response.status}: ${await response.text()}`;
      continue;
    }

    const json = (await response.json()) as GroqContentResponse;
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      lastError = `Modelo ${model} retornou conteúdo vazio.`;
      continue;
    }

    return JSON.parse(content) as Record<string, unknown>;
  }

  throw new Error(lastError);
}

function mapClinicalResponse(aiResponse: BackendClinicalModelResponse, fallback: LocalAssessment) {
  return {
    ...mergeClinicalWithFallback(aiResponse, fallback),
    analysisSource: 'groq' as const,
  };
}

function sanitizeMedbotInput(input: string) {
  const cleaned = String(input || '').trim();
  if (!cleaned) return { valid: false as const, error: 'Input vazio.' };
  if (cleaned.length > 500) return { valid: false as const, error: 'Input muito longo (máx 500 caracteres).' };
  if (/(ignore|system prompt|api key|token|bypass|jailbreak)/i.test(cleaned)) return { valid: false as const, error: 'Input inválido para contexto educacional.' };
  if (!/[a-zA-ZÀ-ÿ]/.test(cleaned)) return { valid: false as const, error: 'Input fora do contexto textual.' };
  return { valid: true as const, sanitized: cleaned };
}

type SessionState = {
  interactions: string[];
  topics: Set<string>;
  usedIds: Set<string>;
  userLevel: 'iniciante' | 'intermediario' | 'avancado';
  lastIntent?: MedbotIntent;
  createdAt: number;
  lastAccessed: number;
};

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const sessionCache = new Map<string, SessionState>();
const metrics = {
  startedAt: new Date().toISOString(),
  requestCount: 0,
  byRoute: {} as Record<string, number>,
  fallbackUsage: {
    clinical: 0,
    medbot: 0,
    studyPack: 0,
  },
};

let persistScheduled = false;

async function loadSessionStore() {
  try {
    const raw = await fs.readFile(SESSION_STORE_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Array<{ key: string; state: { interactions: string[]; topics: string[]; usedIds: string[]; userLevel: SessionState['userLevel']; lastIntent?: MedbotIntent; createdAt: number; lastAccessed: number } }>;
    for (const item of parsed) {
      sessionCache.set(item.key, {
        interactions: item.state.interactions || [],
        topics: new Set(item.state.topics || []),
        usedIds: new Set(item.state.usedIds || []),
        userLevel: item.state.userLevel || 'intermediario',
        lastIntent: item.state.lastIntent,
        createdAt: item.state.createdAt || Date.now(),
        lastAccessed: item.state.lastAccessed || Date.now(),
      });
    }
  } catch {
    // no-op: first run or unavailable file
  }
}

async function flushSessionStore() {
  const payload = [...sessionCache.entries()].map(([key, state]) => ({
    key,
    state: {
      interactions: state.interactions,
      topics: [...state.topics],
      usedIds: [...state.usedIds],
      userLevel: state.userLevel,
      lastIntent: state.lastIntent,
      createdAt: state.createdAt,
      lastAccessed: state.lastAccessed,
    },
  }));
  await fs.writeFile(SESSION_STORE_FILE, JSON.stringify(payload), 'utf-8');
}

function scheduleSessionPersist() {
  if (persistScheduled) return;
  persistScheduled = true;
  setTimeout(async () => {
    persistScheduled = false;
    try {
      await flushSessionStore();
    } catch {
      // no-op: telemetry only
    }
  }, 250);
}

function getSessionState(sessionId: string): SessionState {
  const now = Date.now();
  const existing = sessionCache.get(sessionId);
  if (existing && now - existing.lastAccessed < SESSION_TTL_MS) {
    existing.lastAccessed = now;
    return existing;
  }
  const created: SessionState = {
    interactions: [],
    topics: new Set<string>(),
    usedIds: new Set<string>(),
    userLevel: 'intermediario',
    lastIntent: undefined,
    createdAt: now,
    lastAccessed: now,
  };
  sessionCache.set(sessionId, created);
  scheduleSessionPersist();
  return created;
}

function updateSessionState(sessionId: string, partial: Partial<SessionState>) {
  const state = getSessionState(sessionId);
  const next: SessionState = {
    ...state,
    ...partial,
    topics: partial.topics ?? state.topics,
    usedIds: partial.usedIds ?? state.usedIds,
    lastAccessed: Date.now(),
  };
  sessionCache.set(sessionId, next);
  scheduleSessionPersist();
}

function buildLocalMedbotAnswer(params: {
  topicId: string;
  question: string;
  history?: Array<{ role: 'assistant' | 'user'; content: string }>;
  objective?: string;
  quickFacts?: string[];
  clinicalSummary?: string;
  sessionData: SessionData;
  userLevel: 'iniciante' | 'intermediario' | 'avancado';
  source: 'local' | 'groq';
  priorIntent?: MedbotIntent;
}) {
  const objective = params.objective || 'Revisar raciocínio clínico e priorização de risco.';
  const facts = (params.quickFacts || []).slice(0, 3);
  const interactionId = crypto.randomUUID();
  const { intent, text, suggestions, sourceLabel, difficulty } = buildMedbotLocalContent({
    topicId: params.topicId,
    question: params.question,
    history: params.history || [],
    objective,
    quickFacts: facts,
    clinicalSummary: params.clinicalSummary,
    userLevel: params.userLevel,
    source: params.source,
    priorIntent: params.priorIntent,
  });

  return {
    response: {
      session_id: params.sessionData.sessionUuid,
      interaction_id: interactionId,
      timestamp: params.sessionData.timestamp,
      user_level: params.userLevel,
      intent,
      content: {
        text,
        type: intent === 'quiz' ? 'quiz' : intent === 'caso' ? 'case' : intent === 'medicamento' ? 'medication' : 'text',
        metadata: {
          topic: params.topicId,
          sources: [sourceLabel, ...getTopicReferences(params.topicId).map((item) => item.url)],
          difficulty,
          estimated_read_time: Math.max(45, Math.ceil(text.length / 12)),
        },
      },
      suggestions,
      session_state: {
        total_interactions: params.sessionData.interactionNumber,
        topics_covered: [params.topicId],
        used_ids: [interactionId],
      },
    },
  };
}

type RequestCounter = { count: number; resetAt: number };
const rateCounter = new Map<string, RequestCounter>();
const sessionInteractions = new Map<string, number>();

function createRateLimiter(maxRequests = 40, windowMs = 60_000) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const userId = typeof req.headers['x-user-id'] === 'string' ? req.headers['x-user-id'] : '';
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = userId ? `user:${userId}` : `ip:${ip}`;
    const now = Date.now();
    const current = rateCounter.get(key);

    if (!current || now >= current.resetAt) {
      rateCounter.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (current.count >= maxRequests) {
      return res.status(429).json({ error: 'Muitas requisições. Tente novamente em instantes.' });
    }

    current.count += 1;
    return next();
  };
}

function requestLogger(req: express.Request, res: express.Response, next: express.NextFunction) {
  const requestId = crypto.randomUUID();
  const startAt = Date.now();
  res.setHeader('x-request-id', requestId);
  metrics.requestCount += 1;
  metrics.byRoute[req.path] = (metrics.byRoute[req.path] || 0) + 1;

  res.on('finish', () => {
    const durationMs = Date.now() - startAt;
    console.log(
      JSON.stringify({
        requestId,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs,
        sessionUuid: req.sessionData?.sessionUuid || null,
      }),
    );
  });

  next();
}

function sessionIsolation(req: express.Request, _res: express.Response, next: express.NextFunction) {
  const incomingSession = typeof req.headers['x-session-uuid'] === 'string' ? req.headers['x-session-uuid'].trim() : '';
  const incomingUser = typeof req.headers['x-user-id'] === 'string' ? req.headers['x-user-id'].trim() : '';
  const sessionUuid = incomingSession || crypto.randomUUID();
  const userId = incomingUser || `anon:${req.ip || req.socket.remoteAddress || 'unknown'}`;
  const interactionNumber = (sessionInteractions.get(sessionUuid) || 0) + 1;
  sessionInteractions.set(sessionUuid, interactionNumber);

  req.headers['x-session-uuid'] = sessionUuid;
  req.sessionData = {
    sessionUuid,
    userId,
    timestamp: new Date().toISOString(),
    interactionNumber,
  };

  for (const [key, state] of sessionCache.entries()) {
    if (Date.now() - state.lastAccessed >= SESSION_TTL_MS) {
      sessionCache.delete(key);
    }
  }

  next();
}

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use(createRateLimiter());
  app.use(sessionIsolation);
  app.use(requestLogger);

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, providerConfigured: Boolean(groqApiKey), model: preferredModel, modelFallbackChain });
  });

  app.get('/api/metrics', (_req, res) => {
    res.json({
      ...metrics,
      sessionCacheSize: sessionCache.size,
      timestamp: new Date().toISOString(),
    });
  });


  app.get('/api/evidence/status', async (_req, res) => {
    res.json(await getEvidenceStatus());
  });

  app.get('/api/evidence/catalog', async (_req, res) => {
    res.json(await getEvidenceCatalog());
  });

  app.get('/api/evidence/search', async (req, res) => {
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    const topic = typeof req.query.topic === 'string' ? req.query.topic : '';
    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
    const domain = typeof req.query.domain === 'string' ? req.query.domain : '';
    const context = typeof req.query.context === 'string' ? req.query.context : '';
    const dimension = typeof req.query.dimension === 'string' ? req.query.dimension : '';
    const results = await searchEvidence({ query, topic, domain, context, dimension, limit });

    res.json({
      query,
      topic,
      domain,
      context,
      dimension,
      count: results.length,
      results,
      educationalWarning: 'Resultados para estudo e contexto educacional; valide em diretrizes locais e fontes oficiais antes de qualquer decisão clínica real.',
    });
  });


  app.get('/api/evidence/brief', async (req, res) => {
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    const topic = typeof req.query.topic === 'string' ? req.query.topic : '';
    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;
    const domain = typeof req.query.domain === 'string' ? req.query.domain : '';
    const context = typeof req.query.context === 'string' ? req.query.context : '';
    const dimension = typeof req.query.dimension === 'string' ? req.query.dimension : '';

    res.json(await getEvidenceBrief({ query, topic, domain, context, dimension, limit }));
  });

  app.post('/api/evidence/refresh', async (_req, res) => {
    res.json(await refreshEvidenceFromSources());
  });

  app.post('/api/clinical-analysis', async (req, res) => {
    const parsed = clinicalRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: 'Payload inválido.', details: parsed.error.flatten() });
    }

    if (!groqApiKey) {
      metrics.fallbackUsage.clinical += 1;
      return res.json({
        ...parsed.data.localAssessment,
        analysisSource: 'local',
      });
    }

    try {
      const contextBlock = parsed.data.context
        ? `Tema educacional: ${parsed.data.context.topicId || 'não informado'}\nObjetivo de estudo: ${parsed.data.context.objective || 'não informado'}`
        : 'Sem contexto educacional adicional.';
      const caseFacts = extractCaseFacts({
        symptoms: parsed.data.patientData.symptoms,
        duration: parsed.data.patientData.duration,
      });

      const rawAiResponse = await callGroq([
        { role: 'system', content: CLINICAL_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `${buildClinicalUserPrompt(parsed.data)}\n${contextBlock}\nFATOS ESTRUTURADOS OBRIGATÓRIOS:\n${JSON.stringify(caseFacts)}\nConsidere explicitamente cada item detectado. Se faltar evidência, assuma incerteza e não invente.\nSe o tema for emergências clínicas, detalhe red flags e priorização de risco.`,
        },
      ]);
      const aiResponse = clinicalModelResponseSchema.parse(rawAiResponse);

      const validation = validateClinicalResponse({
        patientData: parsed.data.patientData,
        response: aiResponse,
      });

      if (!validation.valid) {
        metrics.fallbackUsage.clinical += 1;
        return res.json({
          ...parsed.data.localAssessment,
          analysisSource: 'local',
          validationWarnings: validation.errors,
        });
      }

      return res.json(mapClinicalResponse(aiResponse, parsed.data.localAssessment));
    } catch (error) {
      console.error('clinical-analysis error', error);
      metrics.fallbackUsage.clinical += 1;
      return res.json({
        ...parsed.data.localAssessment,
        analysisSource: 'local',
      });
    }
  });

  app.post('/api/medbot', (_req, res) => {
    return res.status(410).json({
      error: 'Endpoint desativado nesta versão.',
      message: 'O escopo atual mantém apenas anamnese e simulador clínico.',
    });
  });

  app.post('/api/study-pack', (_req, res) => {
    return res.status(410).json({
      error: 'Endpoint desativado nesta versão.',
      message: 'O escopo atual mantém apenas anamnese e simulador clínico.',
    });
  });

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  loadSessionStore()
    .finally(() => {
      createApp().listen(port, () => {
        console.log(`Backend MedInnova rodando em http://localhost:${port}`);
      });
    });
}
