import { describe, expect, it } from "vitest";
import { prioritizeBySymptomMatch, DiagnosisData } from "../src/lib/diagnosisUtils";

describe("prioritizeBySymptomMatch", () => {
  it("ordena hipóteses pelo número de sintomas correspondentes", () => {
    const data: DiagnosisData = {
      hypotheses: [
        {
          name: "Cond1",
          probability: "",
          treatment: "",
          explanation: "causa dor de cabeça",
          differentials: [],
          remedies: [],
          exams: [],
        },
        {
          name: "Cond2",
          probability: "",
          treatment: "",
          explanation: "causa dor de cabeça e febre",
          differentials: [],
          remedies: [],
          exams: [],
        },
      ],
    };

    const result = prioritizeBySymptomMatch("febre, dor de cabeça", data);
    expect(result.hypotheses[0].name).toBe("Cond2");
  });
});
