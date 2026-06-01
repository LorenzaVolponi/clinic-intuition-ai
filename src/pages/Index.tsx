import { Suspense, lazy, useEffect, useState } from 'react';
import { SafetyWarning } from '@/components/SafetyWarning';
import { analyzeClinicalCase } from '@/lib/aiClient';
import { clearStoredClinicalSession, getStoredClinicalSession, saveClinicalSession } from '@/lib/sessionStore';
import type { ClinicalAssessment, PatientData } from '@/lib/medicalKnowledge';
import { CheckCircle2, Loader2, ShieldCheck, Stethoscope } from 'lucide-react';

const PatientForm = lazy(() =>
  import('@/components/PatientForm').then((module) => ({ default: module.PatientForm })),
);
const DiagnosisResult = lazy(() =>
  import('@/components/DiagnosisResult').then((module) => ({ default: module.DiagnosisResult })),
);

const LoadingPanel = () => (
  <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
    <div className="flex items-center justify-center gap-3 text-sm font-medium text-slate-600">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      Carregando módulo clínico...
    </div>
  </div>
);

const Index = () => {
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [diagnosis, setDiagnosis] = useState<ClinicalAssessment | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const storedSession = getStoredClinicalSession();
    if (!storedSession) return;

    setPatientData(storedSession.patientData);
    setDiagnosis(storedSession.diagnosis);
  }, []);

  const handleFormSubmit = async (data: PatientData) => {
    setIsAnalyzing(true);
    setPatientData(data);

    try {
      const nextDiagnosis = await analyzeClinicalCase(data, {
        topicId: 'clinica-geral',
        objective: 'simulacao-clinica',
      });
      setDiagnosis(nextDiagnosis);
      saveClinicalSession(data, nextDiagnosis);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    clearStoredClinicalSession();
    setPatientData(null);
    setDiagnosis(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-[max(env(safe-area-inset-bottom),1rem)] pt-[max(env(safe-area-inset-top),0px)] text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/aix8c-logo.svg"
              alt="AIX8C logo"
              width="36"
              height="36"
              decoding="async"
              fetchPriority="high"
              className="h-9 w-9 rounded-xl border border-slate-200 bg-white"
            />
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">Dr. IA — Simulador Clínico</h1>
              <p className="hidden text-sm text-slate-500 sm:block">Anamnese guiada para casos educacionais fictícios.</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:flex">
            <ShieldCheck className="h-4 w-4" />
            Educacional
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-5 sm:px-6 sm:pt-8">
        <section className="mb-5 grid gap-4 lg:grid-cols-[1fr_22rem] lg:items-stretch">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Stethoscope className="h-5 w-5" />
            </div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Clínica simulada</p>
            <h2 className="max-w-3xl text-2xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Uma tela simples para coletar dados, analisar hipóteses e estudar com segurança.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Interface limpa, rápida e focada no essencial: anamnese, triagem educacional, hipóteses, exames e sinais de alerta.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
              {['Mobile-first', 'Sem distrações', 'Uso educacional'].map((label) => (
                <span key={label} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <SafetyWarning />
        </section>

        <Suspense fallback={<LoadingPanel />}>
          {!diagnosis || !patientData ? (
            <PatientForm onSubmit={handleFormSubmit} isAnalyzing={isAnalyzing} patientData={patientData} />
          ) : (
            <DiagnosisResult diagnosis={diagnosis} patientData={patientData} onReset={handleReset} />
          )}
        </Suspense>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-4 pb-[max(env(safe-area-inset-bottom),1rem)] text-center text-xs text-slate-500 sm:px-6">
        AIX8C - @lorenzavolponi - Educação + Medicina + Tecnologia = Sucesso no aprendizado
      </footer>
    </div>
  );
};

export default Index;
