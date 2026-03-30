const FORBIDDEN_NON_MEDICAL_PATTERNS = [
  /aposta|bet|cassino|roleta|loteria/i,
  /criptomoeda|bitcoin|trading|forex/i,
  /hack|invadir|phishing|malware/i,
  /conte[uú]do adulto|porn/i,
];

const MEDICAL_ANCHOR_PATTERNS = [
  /cl[ií]nico|paciente|diagn[oó]stico|sintoma|conduta|triagem|red flag|exame|protocolo/i,
  /medicamento|farmaco|farmacol|dose|intera[çc][aã]o/i,
  /fisiopatologia|risco|urg[eê]ncia|emerg[eê]ncia/i,
];

export function isMedbotAnswerSafe({ topicId, text }) {
  const content = String(text || '').trim();
  if (!content) return false;

  if (FORBIDDEN_NON_MEDICAL_PATTERNS.some((pattern) => pattern.test(content))) {
    return false;
  }

  const topicMentioned = topicId ? new RegExp(String(topicId), 'i').test(content) : false;
  const hasMedicalAnchor = MEDICAL_ANCHOR_PATTERNS.some((pattern) => pattern.test(content));
  return topicMentioned || hasMedicalAnchor;
}
