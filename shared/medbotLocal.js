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

function resolveConversationIntent(question, history = []) {
  const explicitIntent = detectMedbotIntent(question);
  if (explicitIntent !== 'duvida') return explicitIntent;

  const q = String(question || '').trim().toLowerCase();
  const continuationOnly = /^(continua|continue|segue|prossegue|aprofunda|mais|pr[oó]ximo|proximo)$/i.test(q);
  if (continuationOnly) return inferIntentFromHistory(history);

  return 'duvida';
}

function inferResponseStyle(question = '') {
  const q = String(question || '').toLowerCase();
  if (/(curto|resumido|3 linhas|objetivo|sem enrola[çc][aã]o)/i.test(q)) return 'concise';
  if (/(detalha|detalhado|aprofunda|profundo|mais completo)/i.test(q)) return 'detailed';
  if (/(passo a passo|etapas|roteiro|fluxo)/i.test(q)) return 'step';
  return 'default';
}

export function buildMedbotLocalContent(params) {
  const referenceLabel = formatReferencesForText(params.topicId);
  const references = getTopicReferences(params.topicId);
  const objective = params.objective || 'Revisar raciocínio clínico e priorização de risco.';
  const facts = (params.quickFacts || []).slice(0, 3);
  const intent = resolveConversationIntent(params.question, params.history || []);
  const sourceLabel = params.source === 'local' ? 'Consenso educacional local (atualização recomendada)' : 'Modelo Groq';
  const isHelpIntent = /(como pode me ajudar|como você pode ajudar|ajuda|comandos|o que voc[eê] faz)/i.test(params.question);
  const askedTopicMatch =
    params.question.match(/(?:sobre|entender|estudar|revisar)\s+(.+)$/i) ||
    params.question.match(/quero ajuda(?: para)?\s+(.+)$/i);
  const askedTopic = askedTopicMatch?.[1]?.trim().replace(/[?.!]+$/, '') || '';
  const hasRecentHistory = (params.history || []).length > 0;
  const lastUserMessage = [...(params.history || [])].reverse().find((item) => item.role === 'user')?.content;
  const continuityHook = lastUserMessage ? `Último ponto que você trouxe: "${String(lastUserMessage).slice(0, 120)}".` : '';
  const responseStyle = inferResponseStyle(params.question);
  const objectiveHook = `Objetivo atual: ${objective}.`;
  const factHook = facts.length ? `Pontos-chave do tema: ${facts.join(' • ')}.` : '';
  const levelLabel = params.userLevel === 'iniciante' ? 'iniciante' : params.userLevel === 'avancado' ? 'avançado' : 'intermediário';

  let text = `Perfeito — vamos direto ao ponto em **${params.topicId}** (nível ${levelLabel}).\n\n${objectiveHook}\n${factHook}\n\n📌 **Resumo rápido**\n• conceito central\n• decisão clínica que mais cai\n• principal red flag\n\nSe quiser, no próximo passo eu transformo isso em caso clínico ou quiz.`;

  if (isHelpIntent) {
    text = askedTopic
      ? `Boa! Vamos estudar **${askedTopic}** de forma prática.\n\n1) **Fundamento em 30s**: definição + mecanismo principal.\n2) **Aplicação clínica**: quando suspeitar e o que não pode faltar.\n3) **Fixação rápida**: 3 perguntas objetivas com feedback.\n\n📚 Referência-base: ${referenceLabel}.\n\nSe preferir, começamos agora pelo item 1.`
      : `Fechado 🤝 eu sigo o seu ritmo e respondo no formato que você pedir (resumo, caso, quiz ou comparação), sem enrolação.\n\n📚 Referência-base: ${referenceLabel}.\n\nMe diga o tema e eu já começo com uma explicação objetiva em linguagem ${levelLabel}.`;
  } else if (hasRecentHistory) {
    text = `Continuando de onde paramos em **${params.topicId}**:\n\n${continuityHook}\n${objectiveHook}\n\n• ponto-chave clínico\n• exame que muda conduta\n• erro comum para evitar\n\nSe quiser, envio agora a versão em caso clínico curto.`;
  }

  if (responseStyle === 'concise') {
    text = `Fechado — versão curta em **${params.topicId}**:\n\n1) conceito central\n2) red flag principal\n3) ação inicial segura\n\nSe quiser, te mando a versão detalhada depois.`;
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

  if (intent === 'duvida' && !isHelpIntent) {
    text = `Entendi. Me manda em uma frase o que você quer agora em **${params.topicId}** (resumo, caso, quiz, comparação ou farmacologia) e eu sigo exatamente nesse formato, sem enrolação.\n\n${hasRecentHistory ? continuityHook : ''}`.trim();
  }

  const suggestions = isHelpIntent
    ? askedTopic
      ? [`resumo ${askedTopic}`, `caso clínico ${askedTopic}`, `quiz ${askedTopic}`]
      : ['resumo do tema', 'caso clínico curto', 'quiz de 3 perguntas']
    : intent === 'quiz'
      ? ['próxima', 'resumo', 'caso clínico']
      : intent === 'caso'
        ? ['outro caso', 'mais difícil', 'quiz']
        : ['medicamentos', 'caso clínico', 'quiz'];

  const difficulty = params.userLevel === 'iniciante' ? 'easy' : params.userLevel === 'avancado' ? 'hard' : 'medium';

  return { intent, text, suggestions, sourceLabel, difficulty, references };
}
