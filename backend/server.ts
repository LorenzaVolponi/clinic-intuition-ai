import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import crypto from 'node:crypto';
import { z } from 'zod';
import { buildClinicalUserPrompt, CLINICAL_SYSTEM_PROMPT, MEDBOT_SYSTEM_PROMPT, QUICK_LESSON_SYSTEM_PROMPT, STUDY_PACK_SYSTEM_PROMPT } from './prompts';
import { validateClinicalResponse, type BackendClinicalModelResponse } from './validators';

dotenv.config();

const port = Number(process.env.BACKEND_PORT || 8787);
const groqApiKey = process.env.GROQ_API_KEY?.trim();
const preferredModel = process.env.GROQ_MODEL?.trim() || 'llama-3.3-70b-versatile';
const modelFallbackChain = [preferredModel, 'llama-3.1-70b-versatile', 'llama-3.1-8b-instant'];

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
      probability: z.enum(['Alta', 'Média', 'Baixa']),
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
    .min(1),
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
  ).min(1),
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

function buildLocalStudyPack(topicId: string) {
  const base = studyPackLocalLibrary[topicId] ?? studyPackLocalLibrary.emergencias;
  const shuffle = <T,>(items: T[]) => {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const lessons = Array.from({ length: 10 }, (_, index) => ({
    title: `Aula ${index + 1} • ${topicId}`,
    content: `${shuffle(base.lessons)[0]} Foco: segurança clínica, exames iniciais e tomada de decisão.`,
    topicId,
  }));

  const quiz = Array.from({ length: 10 }, (_, index) => {
    const stem = shuffle(base.questions)[0];
    const correct = 'Priorizar avaliação presencial e conduta baseada em sinais de alarme.';
    const distractors = shuffle([
      'Aguardar evolução sem monitorização.',
      'Ignorar sinais vitais e focar apenas em exames tardios.',
      'Concluir diagnóstico definitivo sem reavaliação clínica.',
    ]);

    return {
      question: `${stem} (Pergunta ${index + 1})`,
      options: shuffle([correct, ...distractors]),
      answer: correct,
      explanation: 'Condutas clínicas devem priorizar estabilidade, red flags e confirmação diagnóstica progressiva.',
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
      id: `${topicId}-flashcard-${index + 1}`,
      front: `Flashcard ${index + 1} • ${topicId}: ${shuffle(base.questions)[0]}`,
      back: shuffle(base.lessons)[0],
      question: `Flashcard ${index + 1} • ${topicId}: ${shuffle(base.questions)[0]}`,
      answer: shuffle(base.lessons)[0],
      hint: 'Relacione o conceito com red flags e decisão inicial.',
    })),
    quiz,
  };
}

function normalizeStudyPackForClient(topicId: string, payload: z.infer<typeof studyPackModelResponseSchema>) {
  const optionsFrom = (item: z.infer<typeof studyPackModelResponseSchema>['quiz'][number]) => {
    return item.options.map((option) => (typeof option === 'string' ? option : option.text));
  };

  const answerFrom = (item: z.infer<typeof studyPackModelResponseSchema>['quiz'][number]) => {
    if (item.answer) return item.answer;
    if (!item.correct_option_id) return optionsFrom(item)[0] || 'Resposta indisponível';
    const matched = item.options.find((opt) => typeof opt !== 'string' && opt.id === item.correct_option_id);
    return typeof matched === 'string' ? matched : matched?.text || optionsFrom(item)[0] || 'Resposta indisponível';
  };

  const quizItems = payload.quiz
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
        options,
        optionObjects: item.options.map((opt, idx) =>
          typeof opt === 'string' ? { id: String.fromCharCode(65 + idx) as 'A' | 'B' | 'C' | 'D', text: opt } : opt,
        ),
        correct_option_id:
          item.correct_option_id ||
          (item.options.find((opt) => (typeof opt === 'string' ? opt === answer : opt.text === answer)) &&
            (item.options.find((opt) => (typeof opt === 'string' ? opt === answer : opt.text === answer)) as { id?: 'A' | 'B' | 'C' | 'D' }).id) ||
          'A',
        answer,
        explanation: item.explanation,
      };
    })
    .filter((item, index, arr) => arr.findIndex((other) => other.hash === item.hash) === index)
    .map(({ hash: _hash, ...rest }) => rest);

  return {
    meta: payload.meta ?? {
      topic: topicId,
      generated_at: payload.generatedAt || new Date().toISOString(),
      safety_warning: topicId === 'emergencias',
    },
    topicId: payload.topicId || payload.meta?.topic || topicId,
    generatedAt: payload.generatedAt || payload.meta?.generated_at || new Date().toISOString(),
    lessons:
      payload.lessons?.map((lesson, index) => {
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
          content: `Gancho: ${aula['1_gancho_clinico']?.descricao || 'Caso clínico rápido.'}\nConceito: ${aula['2_explicacao_direta']?.conceito_chave || 'Revisão objetiva.'}\nPontos essenciais: ${
            aula['2_explicacao_direta']?.pontos_essenciais?.join(' | ') || 'Sem pontos adicionais.'
          }\nRed flags: ${
            aula['5_red_flags']?.flags?.map((flag) => `${flag.sinal} (${flag.conduta_imediata})`).join(' | ') || 'Sem red flags destacadas.'
          }\nResumo de bolso: ${aula['7_resumo_bolso']?.frase_unico || 'Aplicar raciocínio clínico seguro.'}`,
          topicId,
        };
      }) || [],
    flashcards: payload.flashcards.map((card, index) => ({
      id: card.id || `${topicId}-flashcard-${index + 1}`,
      front: card.front || card.question || 'Conceito clínico',
      back: card.back || card.answer || 'Revisar protocolos e red flags.',
      question: card.question || card.front || 'Conceito clínico',
      answer: card.answer || card.back || 'Revisar protocolos e red flags.',
      hint: card.hint || 'Associe com sinais de gravidade e conduta inicial.',
    })),
    quiz: quizItems,
    quiz: payload.quiz.map((item, index) => {
      const options = optionsFrom(item);
      const answer = answerFrom(item);
      return {
        id: item.id || `${topicId}-quiz-${index + 1}`,
        difficulty: item.difficulty || (index % 3 === 0 ? 'easy' : index % 3 === 1 ? 'medium' : 'hard'),
        scenario: item.scenario || '',
        question: item.scenario ? `${item.scenario}\n\n${item.question}` : item.question,
        options,
        optionObjects: item.options.map((opt, idx) =>
          typeof opt === 'string' ? { id: String.fromCharCode(65 + idx) as 'A' | 'B' | 'C' | 'D', text: opt } : opt,
        ),
        correct_option_id:
          item.correct_option_id ||
          (item.options.find((opt) => (typeof opt === 'string' ? opt === answer : opt.text === answer)) &&
            (item.options.find((opt) => (typeof opt === 'string' ? opt === answer : opt.text === answer)) as { id?: 'A' | 'B' | 'C' | 'D' }).id) ||
          'A',
        answer,
        explanation: item.explanation,
      };
    }),
  };
}

async function callGroq(messages: Array<{ role: 'system' | 'user'; content: string }>) {
  if (!groqApiKey) {
    throw new Error('Backend IA não configurado. Defina GROQ_API_KEY.');
  }

  let lastError = 'Falha desconhecida.';

  for (const model of modelFallbackChain) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
    });

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
  const investigation = aiResponse.investigationPlan;
  const conduct = aiResponse.conduct;
  const hypotheses = aiResponse.hypotheses.slice(0, 3);

  return {
    hypotheses: hypotheses.length > 0
      ? hypotheses.map((item) => ({
          name: item.name || 'Hipótese não informada',
          probability: item.probability === 'Alta' ? 'Alta' : item.probability === 'Média' ? 'Moderada' : 'Baixa',
          treatment: `${conduct.legalNotice || 'Conduta educacional baseada em estabilização, monitorização e protocolos institucionais.'} Ações sugeridas: ${conduct.immediateActions.join(', ')}`,
          explanation: `${item.justification || 'Sem justificativa estruturada.'} ${item.physiopathology || ''}`.trim(),
          differentials: item.differentials,
          recommendedExams: item.exams,
          redFlags: investigation.specialAttention,
          score: typeof item.confidenceScore === 'number' ? Math.max(0, Math.min(item.confidenceScore, 100)) : 70,
        }))
      : fallback.hypotheses,
    emergencyWarning:
      aiResponse.triageLevel === 'Emergência'
        ? '🚨 Caso potencialmente crítico em contexto educacional. Encaminhar imediatamente para avaliação presencial/emergência.'
        : fallback.emergencyWarning,
    triageLevel:
      aiResponse.triageLevel === 'Urgência'
        ? 'Urgente'
        : aiResponse.triageLevel === 'Emergência'
          ? 'Emergência'
          : aiResponse.triageLevel === 'Eletivo'
            ? 'Ambulatorial'
            : fallback.triageLevel,
    triageReason: aiResponse.triageReason || fallback.triageReason,
    suggestedExams: [
      ...new Set([...investigation.immediate, ...investigation.complementary, ...investigation.specialAttention]),
    ].slice(0, 8),
    immediateActions: [...new Set([...conduct.immediateActions, ...conduct.monitoring])].slice(0, 6),
    clinicalSummary: aiResponse.educationalWarning || fallback.clinicalSummary,
    analysisSource: 'groq' as const,
  };
}

function detectMedbotIntent(question: string): MedbotIntent {
  const q = question.toLowerCase();
  if (/(quiz|pergunta|quest[õo]es)/i.test(q)) return 'quiz';
  if (/(caso cl[ií]nico|anamnese|simulado)/i.test(q)) return 'caso';
  if (/(medicamento|dose|farmaco|f[áa]rmaco)/i.test(q)) return 'medicamento';
  if (/(comparar|vs|versus|diferen[çc]a)/i.test(q)) return 'comparacao';
  if (/(resumo|pontos-chave|pontos chave|red flag|revis[aã]o)/i.test(q)) return 'resumo';
  return 'duvida';
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
  createdAt: number;
  lastAccessed: number;
};

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const sessionCache = new Map<string, SessionState>();

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
    createdAt: now,
    lastAccessed: now,
  };
  sessionCache.set(sessionId, created);
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
}

function buildLocalMedbotAnswer(params: {
  topicId: string;
  question: string;
  objective?: string;
  quickFacts?: string[];
  clinicalSummary?: string;
  sessionData: SessionData;
  userLevel: 'iniciante' | 'intermediario' | 'avancado';
  source: 'local' | 'groq';
}) {
  const objective = params.objective || 'Revisar raciocínio clínico e priorização de risco.';
  const facts = (params.quickFacts || []).slice(0, 3);
  const question = params.question.toLowerCase();
  const intent = detectMedbotIntent(params.question);
  const interactionId = crypto.randomUUID();
  const difficulty = params.userLevel === 'iniciante' ? 'easy' : params.userLevel === 'avancado' ? 'hard' : 'medium';
  const sourceLabel = params.source === 'local' ? 'Consenso educacional local (atualização recomendada)' : 'Modelo Groq';

  let text = `📌 **TÓPICO: ${params.topicId}**\n\n🎯 **EM UMA FRASE:**\n${objective}\n\n🔑 **PONTOS-CHAVE:**\n• ${facts[0] || 'Defina hipótese principal com base em história e exame.'}\n• ${facts[1] || 'Priorize exames que mudam conduta nas próximas horas.'}\n• ${facts[2] || 'Reavalie sinais vitais e red flags continuamente.'}\n\n🚨 **RED FLAGS (NÃO IGNORE!):**\n⚠️ Rebaixamento de consciência → encaminhar emergência\n⚠️ Instabilidade hemodinâmica → suporte imediato + supervisão presencial\n\n📖 **BASEADO EM:** ${sourceLabel}\n\n---\n💡 **QUER APROFUNDAR?**\n→ Digite "caso clínico"\n→ Digite "quiz"\n→ Digite "medicamentos"`;

  if (intent === 'caso') {
    text = `🏥 **CASO CLÍNICO #${interactionId.slice(0, 8).toUpperCase()}**\n\n👤 **PACIENTE:** Adulto com foco em ${params.topicId}\n\n📋 **HISTÓRIA:**\nQueixa principal e evolução temporal objetiva.\n\n🔍 **EXAME FÍSICO:**\n• Priorize sinais vitais e achados focais.\n\n❓ **PERGUNTA:**\nQual hipótese principal e qual conduta imediata?\n\n✅ **CONDUTA CORRETA:**\nEstratificar gravidade, excluir diagnóstico letal e iniciar suporte.\n\n📚 **POR QUÊ:**\n${params.clinicalSummary || 'A conduta inicial deve ser guiada por risco e tempo-dependência.'}\n\n---\n🎯 **QUER MAIS?**\n→ "outro caso"\n→ "mais difícil"\n→ "quiz"`;
  }

  if (intent === 'quiz') {
    text = `📝 **QUIZ RELÂMPAGO - ${params.topicId.toUpperCase()}**\n\n**Pergunta 1/1**\nQual ação inicial traz mais segurança clínica?\n\nA) Esperar exames tardios\nB) Ignorar red flags\nC) Reavaliar risco + sinais vitais\nD) Definir diagnóstico final sem monitorização\n\n✅ **Resposta:** C\n\n📖 **EXPLICAÇÃO:**\nConduta segura começa pela estabilização e reavaliação contínua.\n\n---\n→ "próxima"\n→ "resumo"\n→ "parar"`;
  }

  const suggestions =
    intent === 'quiz' ? ['próxima', 'resumo', 'caso clínico'] : intent === 'caso' ? ['outro caso', 'mais difícil', 'quiz'] : ['medicamentos', 'caso clínico', 'quiz'];

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
          sources: [sourceLabel],
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

  app.post('/api/clinical-analysis', async (req, res) => {
    const parsed = clinicalRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: 'Payload inválido.', details: parsed.error.flatten() });
    }

    if (!groqApiKey) {
      return res.json({
        ...parsed.data.localAssessment,
        analysisSource: 'local',
      });
    }

    try {
      const contextBlock = parsed.data.context
        ? `Tema educacional: ${parsed.data.context.topicId || 'não informado'}\nObjetivo de estudo: ${parsed.data.context.objective || 'não informado'}`
        : 'Sem contexto educacional adicional.';

      const rawAiResponse = await callGroq([
        { role: 'system', content: CLINICAL_SYSTEM_PROMPT },
        { role: 'user', content: `${buildClinicalUserPrompt(parsed.data)}\n${contextBlock}\nSe o tema for emergências clínicas, detalhe red flags e priorização de risco.` },
      ]);
      const aiResponse = clinicalModelResponseSchema.parse(rawAiResponse);

      const validation = validateClinicalResponse({
        patientData: parsed.data.patientData,
        response: aiResponse,
      });

      if (!validation.valid) {
        return res.status(422).json({
          error: 'Resposta da IA reprovada nas validações clínicas.',
          validationErrors: validation.errors,
        });
      }

      return res.json(mapClinicalResponse(aiResponse, parsed.data.localAssessment));
    } catch (error) {
      console.error('clinical-analysis error', error);
      return res.json({
        ...parsed.data.localAssessment,
        analysisSource: 'local',
      });
    }
  });

  app.post('/api/medbot', async (req, res) => {
    const parsed = medbotRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: 'Payload inválido.', details: parsed.error.flatten() });
    }
    const sanitized = sanitizeMedbotInput(parsed.data.question);
    if (!sanitized.valid) {
      return res.status(400).json({ error: sanitized.error });
    }
    const sessionId = (req.sessionData as SessionData).sessionUuid;
    const sessionState = getSessionState(sessionId);
    const userLevel = parsed.data.userLevel || parsed.data.context?.userLevel || sessionState.userLevel;
    sessionState.userLevel = userLevel;
    sessionState.topics.add(parsed.data.topicId);

    if (!groqApiKey) {
      const fallback = buildLocalMedbotAnswer({
        topicId: parsed.data.topicId,
        question: sanitized.sanitized,
        objective: parsed.data.context?.objective,
        quickFacts: parsed.data.context?.quickFacts,
        clinicalSummary: parsed.data.context?.clinicalSummary,
        sessionData: req.sessionData as SessionData,
        userLevel,
        source: 'local',
      });
      sessionState.interactions.push(fallback.response.interaction_id);
      sessionState.usedIds.add(fallback.response.interaction_id);
      updateSessionState(sessionId, sessionState);

      return res.json({
        answer: fallback.response.content.text,
        response: {
          ...fallback.response,
          session_state: {
            ...fallback.response.session_state,
            total_interactions: sessionState.interactions.length,
            topics_covered: [...sessionState.topics],
            used_ids: [...sessionState.usedIds],
          },
        },
        source: 'local',
        suggestions: fallback.response.suggestions,
        intent: fallback.response.intent,
      });
    }

    try {
      const historyText = (parsed.data.history || []).slice(-6).map((item) => `${item.role}: ${item.content}`).join('\n');
      const contextText = parsed.data.context
        ? `Objetivo: ${parsed.data.context.objective || 'não informado'}\nPontos-chave: ${(parsed.data.context.quickFacts || []).join(' | ') || 'não informado'}\nResumo clínico: ${parsed.data.context.clinicalSummary || 'não informado'}`
        : 'Sem contexto adicional.';
      const rawResponse = await callGroq([
        { role: 'system', content: MEDBOT_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Tema: ${parsed.data.topicId}\nNível: ${userLevel}\nContexto:\n${contextText}\nHistórico recente:\n${historyText || 'Sem histórico'}\nPergunta atual: ${sanitized.sanitized}\nSession UUID: ${(req.sessionData as SessionData).sessionUuid}\nTimestamp: ${(req.sessionData as SessionData).timestamp}\nInteraction: ${(req.sessionData as SessionData).interactionNumber}`,
        },
      ]);
      const response = medbotModelResponseSchema.safeParse(rawResponse);
      const fallback = buildLocalMedbotAnswer({
        topicId: parsed.data.topicId,
        question: sanitized.sanitized,
        objective: parsed.data.context?.objective,
        quickFacts: parsed.data.context?.quickFacts,
        clinicalSummary: parsed.data.context?.clinicalSummary,
        sessionData: req.sessionData as SessionData,
        userLevel,
        source: 'groq',
      });
      const normalized = response.success ? response.data.response : fallback.response;
      sessionState.interactions.push(normalized.interaction_id);
      sessionState.usedIds.add(normalized.interaction_id);
      updateSessionState(sessionId, sessionState);

      return res.json({
        answer: normalized.content.text,
        response: {
          ...normalized,
          session_state: {
            ...normalized.session_state,
            total_interactions: sessionState.interactions.length,
            topics_covered: [...sessionState.topics],
            used_ids: [...sessionState.usedIds],
          },
        },
        source: 'groq',
        suggestions: normalized.suggestions,
        intent: normalized.intent,
      });
    } catch (error) {
      console.error('medbot error', error);
      const fallback = buildLocalMedbotAnswer({
        topicId: parsed.data.topicId,
        question: sanitized.sanitized,
        objective: parsed.data.context?.objective,
        quickFacts: parsed.data.context?.quickFacts,
        clinicalSummary: parsed.data.context?.clinicalSummary,
        sessionData: req.sessionData as SessionData,
        userLevel,
        source: 'local',
      });
      sessionState.interactions.push(fallback.response.interaction_id);
      sessionState.usedIds.add(fallback.response.interaction_id);
      updateSessionState(sessionId, sessionState);
      return res.json({
        answer: fallback.response.content.text,
        response: {
          ...fallback.response,
          session_state: {
            ...fallback.response.session_state,
            total_interactions: sessionState.interactions.length,
            topics_covered: [...sessionState.topics],
            used_ids: [...sessionState.usedIds],
          },
        },
        source: 'local',
        suggestions: fallback.response.suggestions,
        intent: fallback.response.intent,
      });
    }
  });

  app.post('/api/study-pack', async (req, res) => {
    const parsed = studyPackRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Payload inválido.', details: parsed.error.flatten() });
    }

    if (!groqApiKey) {
      return res.json(buildLocalStudyPack(parsed.data.topicId));
    }

    try {
      const rawResponse = await callGroq([
        {
          role: 'system',
          content: `${STUDY_PACK_SYSTEM_PROMPT}\n\n${QUICK_LESSON_SYSTEM_PROMPT}`,
        },
        {
          role: 'user',
          content: `Gere um pacote de estudo para o tema ${parsed.data.topicId}. Inclua lessons[] (10) no formato de aula rápida quando possível, flashcards[] (>=5) e quiz[] (>=7), com JSON válido.`,
        },
      ]);
      const response = studyPackModelResponseSchema.safeParse(rawResponse);
      if (!response.success) {
        return res.json(buildLocalStudyPack(parsed.data.topicId));
      }
      return res.json(normalizeStudyPackForClient(parsed.data.topicId, response.data));
    } catch (error) {
      console.error('study-pack error', error);
      return res.json(buildLocalStudyPack(parsed.data.topicId));
    }
  });

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  createApp().listen(port, () => {
    console.log(`Backend MedInnova rodando em http://localhost:${port}`);
  });
}
