export interface Hypothesis {
  name: string;
  probability: string;
  treatment: string;
  explanation: string;
  differentials: string[];
  remedies: string[];
  exams: string[];
}

export interface DiagnosisData {
  hypotheses: Hypothesis[];
  emergencyWarning?: string;
  unexplainedSymptoms?: string[];
}

export function prioritizeBySymptomMatch(
  symptoms: string,
  data: DiagnosisData
): DiagnosisData {
  const list = symptoms
    .split(/,|;| e /i)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const scored = data.hypotheses
    .map((h) => {
      const text = `${h.name} ${h.explanation} ${h.differentials.join(" ")}`.toLowerCase();
      const score = list.reduce(
        (acc, symptom) => acc + (text.includes(symptom) ? 1 : 0),
        0
      );
      return { score, ...h };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ score, ...rest }) => rest);
  return { ...data, hypotheses: scored };
}

export function normalizeHypotheses(data: DiagnosisData): DiagnosisData {
  const defaults = ["Alta", "Moderada", "Baixa"] as const;
  const normalized = data.hypotheses.slice(0, 3);
  while (normalized.length < 3) {
    normalized.push({
      name: "Hipótese não fornecida",
      probability: "Baixa",
      treatment: "—",
      explanation: "—",
      differentials: [],
      remedies: [],
      exams: [],
    });
  }
  return {
    ...data,
    hypotheses: normalized.map((h, i) => ({
      ...h,
      remedies: h.remedies ?? [],
      exams: h.exams ?? [],
      probability: defaults[i],
    })),
  };
}
