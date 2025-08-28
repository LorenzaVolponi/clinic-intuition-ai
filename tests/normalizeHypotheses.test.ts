import { describe, expect, it } from "vitest";
import { normalizeHypotheses, DiagnosisData } from "../src/lib/diagnosisUtils";

describe("normalizeHypotheses", () => {
  it("preenche hipóteses ausentes e define probabilidades padrão", () => {
    const data: DiagnosisData = {
      hypotheses: [
        {
          name: "Cond1",
          probability: "",
          treatment: "",
          explanation: "",
          differentials: [],
          remedies: [],
          exams: [],
        },
      ],
    };

    const result = normalizeHypotheses(data);
    expect(result.hypotheses).toHaveLength(3);
    expect(result.hypotheses[0].probability).toBe("Alta");
    expect(result.hypotheses[1].probability).toBe("Moderada");
    expect(result.hypotheses[2].probability).toBe("Baixa");
  });
});
