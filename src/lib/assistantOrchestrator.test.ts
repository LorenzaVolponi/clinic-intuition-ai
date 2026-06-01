import { describe, expect, it } from 'vitest';
import { classifyAssistantIntent, runAssistantCommand } from './assistantOrchestrator';
import { ClinicalAssessment, PatientData } from './medicalKnowledge';

const patientData: PatientData = {
  name: 'Caso Simulado',
  age: 52,
  gender: 'feminino',
  symptoms: 'dor torácica e sudorese',
  duration: '< 6h',
};

const diagnosis: ClinicalAssessment = {
  triageLevel: 'Emergência',
  triageReason: 'Dor torácica com sinais autonômicos exige avaliação imediata.',
  clinicalSummary: 'Quadro compatível com dor torácica de alto risco em contexto educacional.',
  emergencyWarning: 'Procure emergência imediatamente em caso real.',
  suggestedExams: ['ECG', 'Troponina seriada'],
  immediateActions: ['Monitorização', 'Avaliação presencial imediata'],
  analysisSource: 'local',
  hypotheses: [
    {
      name: 'Síndrome Coronariana Aguda',
      probability: 'Alta',
      treatment: 'Suporte e protocolo institucional.',
      explanation: 'Dor torácica com sudorese aumenta risco.',
      differentials: ['Embolia pulmonar'],
      recommendedExams: ['ECG'],
      redFlags: ['sudorese profusa', 'dor em aperto'],
      score: 91,
    },
  ],
};

describe('assistantOrchestrator', () => {
  it('classifica comandos clínicos principais', () => {
    expect(classifyAssistantIntent('quais red flags?')).toBe('red_flags');
    expect(classifyAssistantIntent('quais exames pedir?')).toBe('exams');
    expect(classifyAssistantIntent('ações imediatas')).toBe('actions');
    expect(classifyAssistantIntent('resuma o caso')).toBe('summary');
  });

  it('pede anamnese analisada antes de responder dados dependentes de diagnóstico', () => {
    const result = runAssistantCommand('quais exames?', { patientData: null, diagnosis: null });
    expect(result.title).toContain('Ainda preciso');
    expect(result.message).toContain('Analisar Caso Clínico');
  });

  it('gera resposta acionável para exame com caso analisado', () => {
    const result = runAssistantCommand('quais exames?', { patientData, diagnosis });
    expect(result.intent).toBe('exams');
    expect(result.message).toContain('ECG');
    expect(result.message).toContain('Troponina');
  });

  it('sinaliza reset para comando de novo caso', () => {
    const result = runAssistantCommand('novo caso', { patientData, diagnosis });
    expect(result.shouldReset).toBe(true);
  });
});
