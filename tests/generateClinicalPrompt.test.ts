import { describe, expect, it } from "vitest";
import { generateClinicalPrompt } from "../src/lib/medicalKnowledge";

const sample = {
  name: "Ana",
  age: 22,
  gender: "Feminino",
  symptoms: "dor de cabeça, febre",
  duration: "2 dias",
};

describe("generateClinicalPrompt", () => {
  it("inclui dados do paciente no prompt", () => {
    const prompt = generateClinicalPrompt(sample);
    expect(prompt).toContain("Ana");
    expect(prompt).toContain("dor de cabeça");
    expect(prompt).toContain("2 dias");
  });
});
