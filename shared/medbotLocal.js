import crypto from 'node:crypto';
import { formatReferencesForText, getTopicReferences } from './clinicalReferences.js';

export function detectMedbotIntent(question) {
  const q = String(question || '').toLowerCase();
  if (/(agora|quero|vamos)\s+(quiz|pergunta)/i.test(q)) return 'quiz';
  if (/(agora|quero|vamos)\s+(caso|caso cl[ií]nico|simulado)/i.test(q)) return 'caso';
  if (/(agora|quero|vamos)\s+(resumo|revis[aã]o|resumir)/i.test(q)) return 'resumo';
  if (/(quiz|pergunta|quest[õo]es|quest)/i.test(q)) return 'quiz';
  if (/(caso cl[ií]nico|anamnese|simulado|caso)/i.test(q)) return 'caso';
  if (/(medicamento|dose|farmaco|f[áa]rmaco)/i.test(q)) return 'medicamento';
  if (/(comparar|vs|versus|diferen[çc]a)/i.test(q)) return 'comparacao';
  if (/(impactos?|efeitos?|consequ[eê]ncias?|complica[cç][õo]es|resumo de|explica|explique)/i.test(q)) return 'resumo';
  if (/(resumo|resuma|resumir|pontos-chave|pontos chave|red flag|revis[aã]o)/i.test(q)) return 'resumo';
  return 'duvida';
}

function inferIntentFromHistory(history = []) {
  const lastAssistant = [...history].reverse().find((item) => item.role === 'assistant')?.content || '';
  if (/QUIZ REL[ÂA]MPAGO/i.test(lastAssistant)) return 'quiz';
  if (/CASO CL[ÍI]NICO/i.test(lastAssistant)) return 'caso';
  if (/FARMACOLOGIA/i.test(lastAssistant)) return 'medicamento';
  return 'resumo';
}

function resolveConversationIntent(question, history = [], priorIntent) {
  const explicitIntent = detectMedbotIntent(question);
  if (explicitIntent !== 'duvida') return explicitIntent;

  const q = String(question || '').trim().toLowerCase();
  const continuationOnly = /^(continua|continue|segue|prossegue|aprofunda|mais|pr[oó]ximo|proximo)$/i.test(q);
  if (continuationOnly) return priorIntent || inferIntentFromHistory(history);

  const hasActionableText = q.split(/\s+/).filter(Boolean).length >= 3 || q.length >= 18;
  if (hasActionableText) return 'resumo';

  return 'duvida';
}

function inferStyleFromHistory(history = []) {
  const lastAssistant = [...history].reverse().find((item) => item.role === 'assistant')?.content || '';
  if (/vers[aã]o curta/i.test(lastAssistant)) return 'concise';
  if (/vamos por etapas|passo a passo/i.test(lastAssistant)) return 'step';
  if (/agir como preceptor|preceptor/i.test(lastAssistant)) return 'coach';
  if (/vamos aprofundar|aprofundar/i.test(lastAssistant)) return 'detailed';
  return 'default';
}

function inferResponseStyle(question = '', history = []) {
  const q = String(question || '').toLowerCase();
  if (/(preceptor|mentoria|me guia|guia como|estilo preceptor|coach)/i.test(q)) return 'coach';
  if (/(curto|resumido|3 linhas|objetivo|sem enrola[çc][aã]o)/i.test(q)) return 'concise';
  if (/(detalha|detalhado|aprofunda|profundo|mais completo)/i.test(q)) return 'detailed';
  if (/(passo a passo|etapas|roteiro|fluxo)/i.test(q)) return 'step';

  const continuationOnly = /^(continua|continue|segue|prossegue|aprofunda|mais|pr[oó]ximo|proximo)$/i.test(String(question || '').trim());
  if (continuationOnly) {
    return inferStyleFromHistory(history);
  }

  return 'default';
}

export function buildMedbotLocalContent(params) {
  const referenceLabel = formatReferencesForText(params.topicId);
  const references = getTopicReferences(params.topicId);
  const objective = params.objective || 'Revisar raciocínio clínico e priorização de risco.';
  const facts = (params.quickFacts || []).slice(0, 3);
  const intent = resolveConversationIntent(params.question, params.history || [], params.priorIntent);
  const sourceLabel = params.source === 'local' ? 'Consenso educacional local (atualização recomendada)' : 'Modelo Groq';
  const isHelpIntent = /(como pode me ajudar|como você pode ajudar|ajuda|comandos|o que voc[eê] faz)/i.test(params.question);
  const askedTopicMatch =
    params.question.match(/(?:sobre|entender|estudar|revisar)\s+(.+)$/i) ||
    params.question.match(/quero ajuda(?: para)?\s+(.+)$/i);
  const askedTopic = askedTopicMatch?.[1]?.trim().replace(/[?.!]+$/, '') || '';
  const hasRecentHistory = (params.history || []).length > 0;
  const lastUserMessage = [...(params.history || [])].reverse().find((item) => item.role === 'user')?.content;
  const continuityHook = lastUserMessage ? `Último ponto que você trouxe: "${String(lastUserMessage).slice(0, 120)}".` : '';
  const trimmedQuestion = String(params.question || '').trim().replace(/[?.!]+$/, '');
  const responseStyle = inferResponseStyle(params.question, params.history || []);
  const objectiveHook = `Objetivo atual: ${objective}.`;
  const factHook = facts.length ? `Pontos-chave do tema: ${facts.join(' • ')}.` : '';
  const levelLabel = params.userLevel === 'iniciante' ? 'iniciante' : params.userLevel === 'avancado' ? 'avançado' : 'intermediário';

  let text = `Boa — em **${params.topicId}** eu te explico de forma direta e natural, sem enrolação.\n\n${objectiveHook}\n${factHook}\n\nSobre "${trimmedQuestion || params.topicId}", o ponto principal é entender o mecanismo central, reconhecer sinais de alerta e decidir a primeira conduta segura. Se quiser, eu aprofundo em cima do seu contexto.`;

  if (isHelpIntent) {
    text = askedTopic
      ? `Perfeito. Vamos em linguagem simples sobre **${askedTopic}**: começo pelo essencial, depois trago aplicação prática e fecho com revisão rápida para fixar.\n\n📚 Referência-base: ${referenceLabel}.`
      : `Fechado 🤝. Pode falar comigo como conversa normal: você traz o tema e eu respondo objetivo, humano e direto ao ponto, no seu ritmo (${levelLabel}).\n\n📚 Referência-base: ${referenceLabel}.`;
  } else if (hasRecentHistory) {
    text = `Continuando de onde paramos em **${params.topicId}**:\n\n${continuityHook}\n${objectiveHook}\n\nSeguindo no mesmo fio da conversa: foque no achado que muda conduta, no exame que realmente altera decisão e no erro mais comum para evitar agora.`;
  }

  if (responseStyle === 'concise') {
    text = `Fechado — versão curta em **${params.topicId}**:\n\n1) conceito central\n2) red flag principal\n3) ação inicial segura\n\nSe quiser, te mando a versão detalhada depois.`;
  } else if (responseStyle === 'coach') {
    text = `Combinado — vou agir como preceptor em **${params.topicId}**.\n\n${objectiveHook}\n\nVamos por etapas:\n1) o que você já sabe (rápido)\n2) lacuna principal agora\n3) mini-caso para fixar conduta\n4) feedback objetivo\n\nTe acompanho sem julgamento, focando decisão clínica segura.`;
  } else if (responseStyle === 'detailed') {
    text = `Perfeito, vamos aprofundar **${params.topicId}** com calma.\n\n${objectiveHook}\n${continuityHook}\n\n1) fisiopatologia prática\n2) reconhecimento clínico (o que muda conduta)\n3) red flags e erros frequentes\n4) checklist de decisão inicial\n\nSe quiser, no final transformo isso em caso clínico aplicado.`;
  } else if (responseStyle === 'step') {
    text = `Boa — vamos em passo a passo para **${params.topicId}**:\n\nPasso 1: reconhecer padrão clínico.\nPasso 2: checar sinais de gravidade.\nPasso 3: priorizar exames que mudam conduta.\nPasso 4: revisar hipótese principal vs diferenciais.\n\nPosso seguir com um exemplo prático no Passo 1 agora.`;
  }

  if (intent === 'caso') {
    const caseId = crypto.randomUUID().slice(0, 8).toUpperCase();
    text = `🏥 **CASO CLÍNICO #${caseId}**\n\n👤 **PACIENTE:** Adulto com foco em ${params.topicId}\n\n📋 **HISTÓRIA:**\nQueixa principal e evolução temporal objetiva.\n\n🔍 **EXAME FÍSICO:**\n• Priorize sinais vitais e achados focais.\n\n❓ **PERGUNTA:**\nQual hipótese principal e qual conduta imediata?\n\n✅ **CONDUTA CORRETA:**\nEstratificar gravidade, excluir diagnóstico letal e iniciar suporte.\n\n📚 **POR QUÊ:**\n${params.clinicalSummary || 'A conduta inicial deve ser guiada por risco e tempo-dependência.'}\n\n🧭 ${objectiveHook}\n${continuityHook}\n\n---\n🎯 **QUER MAIS?**\n→ "outro caso"\n→ "mais difícil"\n→ "quiz"`;
  }

  if (intent === 'quiz') {
    text = `📝 **QUIZ RELÂMPAGO - ${params.topicId.toUpperCase()}**\n\n${objectiveHook}\n\n**Pergunta 1/1**\nQual ação inicial traz mais segurança clínica?\n\nA) Esperar exames tardios\nB) Ignorar red flags\nC) Reavaliar risco + sinais vitais\nD) Definir diagnóstico final sem monitorização\n\n✅ **Resposta:** C\n\n📖 **EXPLICAÇÃO:**\nConduta segura começa pela estabilização e reavaliação contínua.\n\n---\n→ "próxima"\n→ "resumo"\n→ "parar"`;
  }

  if (intent === 'medicamento') {
    text = `💊 **FARMACOLOGIA: foco em ${params.topicId}**\n\n📋 **CLASSE:** revisar por mecanismo e contexto clínico.\n\n🎯 **INDICAÇÕES PRINCIPAIS:**\n• Situações com benefício comprovado em diretriz\n• Cenários de urgência com supervisão clínica\n• Estratégia de manutenção quando estabilizado\n\n⚠️ **SEGURANÇA:**\n• Não usar dose definitiva sem protocolo local\n• Confirmar contraindicações e função renal/hepática\n\n📖 **BASEADO EM:** ${sourceLabel}\n📚 **Referência-base:** ${referenceLabel}\n\n---\n→ Digite "interações"\n→ Digite "alternativas"\n→ Digite "caso clínico"`;
  }

  if (intent === 'comparacao') {
    text = `Ótima comparação. Em **${params.topicId}**, pense assim:\n\n• **Semelhanças-chave**: apresentação inicial e necessidade de triagem.\n• **Diferenças que mudam conduta**: red flags, exame inicial prioritário e tempo-dependência.\n• **Erro comum**: tratar como iguais sem estratificar risco.\n\nSe você quiser, eu comparo em tabela (A x B) no próximo passo.`;
  }

  if (intent === 'duvida' && !isHelpIntent && responseStyle === 'default') {
    text = `Entendi você. Vamos direto no que importa em **${params.topicId}**: explicação clara, conversa fluida e aplicação prática sem ficar te pedindo formato.\n\nSe quiser, já respondo em cima de "${trimmedQuestion || params.topicId}" com foco clínico seguro.${hasRecentHistory ? `\n\n${continuityHook}` : ''}`.trim();
  }

  const suggestions = isHelpIntent
    ? askedTopic
      ? [`quero entender ${askedTopic}`, `me dá exemplo prático`, `resumo rápido`]
      : ['me explica de forma simples', 'aprofunda um pouco', 'me dá exemplo prático']
    : intent === 'quiz'
      ? ['próxima', 'resumo', 'caso clínico']
      : intent === 'caso'
        ? ['outro caso', 'mais difícil', 'quiz']
        : ['aprofunda um pouco', 'me dá exemplo prático', 'resumo rápido'];

  const difficulty = params.userLevel === 'iniciante' ? 'easy' : params.userLevel === 'avancado' ? 'hard' : 'medium';

  return { intent, text, suggestions, sourceLabel, difficulty, references };
}
