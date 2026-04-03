import { useState } from 'react';
import { DiagnosisResult } from '@/components/DiagnosisResult';
import { PatientForm } from '@/components/PatientForm';
import { SafetyWarning } from '@/components/SafetyWarning';
import { analyzeClinicalCase } from '@/lib/aiClient';
import { ClinicalAssessment, PatientData } from '@/lib/medicalKnowledge';

const Index = () => {
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [diagnosis, setDiagnosis] = useState<ClinicalAssessment | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFormSubmit = async (data: PatientData) => {
    setIsAnalyzing(true);
    setPatientData(data);

    try {
      const nextDiagnosis = await analyzeClinicalCase(data, {
        topicId: 'clinica-geral',
        objective: 'simulacao-clinica',
      });
      setDiagnosis(nextDiagnosis);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setPatientData(null);
    setDiagnosis(null);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.98),_rgba(240,247,255,0.95)_55%,_rgba(232,244,255,0.9)_100%)] pb-[max(env(safe-area-inset-bottom),1rem)] pt-[max(env(safe-area-inset-top),0px)] text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-white/85 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-4 sm:px-6 sm:py-6">
          <div className="rounded-xl bg-primary/10 p-1.5 shadow-sm">
            <img
              src="/aix8c-logo.svg"
              alt="AIX8C logo"
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg"
              loading="eager"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">Dr. IA — Anamnese e Simulador Clínico</h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Plataforma focada exclusivamente em coleta de anamnese e suporte educacional para simulação clínica.
            </p>
          </div>
        </div>
      </header>

      <SafetyWarning />

      <main className="mx-auto grid w-full max-w-6xl gap-4 px-3 pb-10 pt-2 sm:gap-6 sm:px-6">
        {!diagnosis || !patientData ? (
          <PatientForm onSubmit={handleFormSubmit} isAnalyzing={isAnalyzing} patientData={patientData} />
        ) : (
          <DiagnosisResult diagnosis={diagnosis} patientData={patientData} onReset={handleReset} />
        )}
      </main>

      <footer className="mx-auto w-full max-w-6xl px-4 pb-[max(env(safe-area-inset-bottom),1rem)] text-center text-xs text-muted-foreground sm:px-6 sm:text-sm">
        AIX8C - @lorenzavolponi - Educação + Medicina + Tecnologia = Sucesso no aprendizado
      </footer>
    </div>
  );
};

export default Index;
