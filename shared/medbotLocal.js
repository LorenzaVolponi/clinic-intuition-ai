import crypto from 'node:crypto';

export function detectMedbotIntent(question) {
  const q = String(question || '').toLowerCase();
  if (/(quiz|pergunta|quest[õo]es|quest)/i.test(q)) return 'quiz';
  if (/(caso cl[ií]nico|anamnese|simulado|caso)/i.test(q)) return 'caso';
  if (/(medicamento|dose|farmaco|f[áa]rmaco)/i.test(q)) return 'medicamento';
  if (/(comparar|vs|versus|diferen[çc]a)/i.test(q)) return 'comparacao';
  if (/(resumo|resuma|resumir|pontos-chave|pontos chave|red flag|revis[aã]o)/i.test(q)) return 'resumo';
  return 'duvida';
}

export function buildMedbotLocalContent(params) {
  const objective = params.objective || 'Revisar raciocínio clínico e priorização de risco.';
  const facts = (params.quickFacts || []).slice(0, 3);
  const intent = detectMedbotIntent(params.question);
  const sourceLabel = params.source === 'local' ? 'Consenso educacional local (atualização recomendada)' : 'Modelo Groq';
  const isHelpIntent = /(como pode me ajudar|como você pode ajudar|ajuda|comandos|o que voc[eê] faz)/i.test(params.question);
  const askedTopicMatch =
    params.question.match(/(?:sobre|entender|estudar|revisar)\s+(.+)$/i) ||
    params.question.match(/quero ajuda(?: para)?\s+(.+)$/i);
  const askedTopic = askedTopicMatch?.[1]?.trim().replace(/[?.!]+$/, '') || '';
  const hasRecentHistory = (params.history || []).length > 0;
  const lastUserMessage = [...(params.history || [])].reverse().find((item) => item.role === 'user')?.content;
  const continuityHook = lastUserMessage ? `Último ponto que você trouxe: "${String(lastUserMessage).slice(0, 120)}".` : '';
  const objectiveHook = `Objetivo atual: ${objective}.`;
  const factHook = facts.length ? `Pontos-chave do tema: ${facts.join(' • ')}.` : '';
  const levelLabel = params.userLevel === 'iniciante' ? 'iniciante' : params.userLevel === 'avancado' ? 'avançado' : 'intermediário';

  let text = `Perfeito — vamos direto ao ponto em **${params.topicId}** (nível ${levelLabel}).\n\n${objectiveHook}\n${factHook}\n\n📌 **Resumo rápido**\n• conceito central\n• decisão clínica que mais cai\n• principal red flag\n\nSe quiser, no próximo passo eu transformo isso em caso clínico ou quiz.`;

  if (isHelpIntent) {
    text = askedTopic
      ? `Boa! Vamos estudar **${askedTopic}** de forma prática.\n\n1) **Fundamento em 30s**: definição + mecanismo principal.\n2) **Aplicação clínica**: quando suspeitar e o que não pode faltar.\n3) **Fixação rápida**: 3 perguntas objetivas com feedback.\n\nSe preferir, começamos agora pelo item 1.`
      : `Fechado 🤝 eu sigo o seu ritmo e respondo no formato que você pedir (resumo, caso, quiz ou comparação), sem enrolação.\n\nMe diga o tema e eu já começo com uma explicação objetiva em linguagem ${levelLabel}.`;
  } else if (hasRecentHistory) {
    text = `Continuando de onde paramos em **${params.topicId}**:\n\n${continuityHook}\n${objectiveHook}\n\n• ponto-chave clínico\n• exame que muda conduta\n• erro comum para evitar\n\nSe quiser, envio agora a versão em caso clínico curto.`;
  }

  if (intent === 'caso') {
    const caseId = crypto.randomUUID().slice(0, 8).toUpperCase();
    text = `🏥 **CASO CLÍNICO #${caseId}**\n\n👤 **PACIENTE:** Adulto com foco em ${params.topicId}\n\n📋 **HISTÓRIA:**\nQueixa principal e evolução temporal objetiva.\n\n🔍 **EXAME FÍSICO:**\n• Priorize sinais vitais e achados focais.\n\n❓ **PERGUNTA:**\nQual hipótese principal e qual conduta imediata?\n\n✅ **CONDUTA CORRETA:**\nEstratificar gravidade, excluir diagnóstico letal e iniciar suporte.\n\n📚 **POR QUÊ:**\n${params.clinicalSummary || 'A conduta inicial deve ser guiada por risco e tempo-dependência.'}\n\n🧭 ${objectiveHook}\n${continuityHook}\n\n---\n🎯 **QUER MAIS?**\n→ "outro caso"\n→ "mais difícil"\n→ "quiz"`;
  }

  if (intent === 'quiz') {
    text = `📝 **QUIZ RELÂMPAGO - ${params.topicId.toUpperCase()}**\n\n${objectiveHook}\n\n**Pergunta 1/1**\nQual ação inicial traz mais segurança clínica?\n\nA) Esperar exames tardios\nB) Ignorar red flags\nC) Reavaliar risco + sinais vitais\nD) Definir diagnóstico final sem monitorização\n\n✅ **Resposta:** C\n\n📖 **EXPLICAÇÃO:**\nConduta segura começa pela estabilização e reavaliação contínua.\n\n---\n→ "próxima"\n→ "resumo"\n→ "parar"`;
  }

  if (intent === 'medicamento') {
    text = `💊 **FARMACOLOGIA: foco em ${params.topicId}**\n\n📋 **CLASSE:** revisar por mecanismo e contexto clínico.\n\n🎯 **INDICAÇÕES PRINCIPAIS:**\n• Situações com benefício comprovado em diretriz\n• Cenários de urgência com supervisão clínica\n• Estratégia de manutenção quando estabilizado\n\n⚠️ **SEGURANÇA:**\n• Não usar dose definitiva sem protocolo local\n• Confirmar contraindicações e função renal/hepática\n\n📖 **BASEADO EM:** ${sourceLabel}\n\n---\n→ Digite "interações"\n→ Digite "alternativas"\n→ Digite "caso clínico"`;
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

  return { intent, text, suggestions, sourceLabel, difficulty };
}
