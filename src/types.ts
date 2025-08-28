export interface PatientData {
  name: string;
  age: number;
  gender: string;
  symptoms: string;
  duration: string;
}

export interface DiagnosisHypothesis {
  name: string;
  probability: string;
  treatment: string;
  explanation: string;
  differentials: string[];
}

export interface DiagnosisData {
  hypotheses: DiagnosisHypothesis[];
  emergencyWarning?: string;
}
