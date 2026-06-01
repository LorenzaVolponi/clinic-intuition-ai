import { Suspense, lazy, useEffect, useState } from 'react';
import { SafetyWarning } from '@/components/SafetyWarning';
import { analyzeClinicalCase } from '@/lib/aiClient';
import { clearStoredClinicalSession, getStoredClinicalSession, saveClinicalSession } from '@/lib/sessionStore';
import type { ClinicalAssessment, PatientData } from '@/lib/medicalKnowledge';
import { Activity, BrainCircuit, CheckCircle2, Loader2, ShieldCheck, Sparkles } from 'lucide-react';

const PatientForm = lazy(() =>
  import('@/components/PatientForm').then((module) => ({ default: module.PatientForm })),
);
const DiagnosisResult = lazy(() =>
  import('@/components/DiagnosisResult').then((module) => ({ default: module.DiagnosisResult })),
);

const clinicalHighlights = [
  { label: 'Anamnese guiada', icon: Activity },
  { label: 'Triagem educacional', icon: ShieldCheck },
  { label: 'Raciocínio clínico', icon: BrainCircuit },
];

const LoadingPanel = () => (
  <div className="rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-2xl shadow-sky-900/10 backdrop-blur-xl">
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <div>
        <p className="text-lg font-bold text-slate-900">Preparando experiência clínica...</p>
        <p className="mt-1 text-sm text-muted-foreground">Carregando módulos sob demanda para uma interface mais rápida.</p>
      </div>
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
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_15%_0%,rgba(125,211,252,0.28),transparent_30%),radial-gradient(circle_at_85%_8%,rgba(167,139,250,0.2),transparent_34%),linear-gradient(180deg,#f8fbff_0%,#eef7ff_50%,#f8fbff_100%)] pb-[max(env(safe-area-inset-bottom),1rem)] pt-[max(env(safe-area-inset-top),0px)] text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-70">
        <div className="absolute left-[-8rem] top-24 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="absolute right-[-6rem] top-8 h-80 w-80 rounded-full bg-violet-200/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-emerald-100/60 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/70 bg-white/80 shadow-sm shadow-sky-900/5 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-2xl bg-white p-1.5 shadow-lg shadow-sky-900/10 ring-1 ring-sky-100">
              <img
                src="/aix8c-logo.svg"
                alt="AIX8C logo"
                width="40"
                height="40"
                decoding="async"
                fetchPriority="high"
                className="h-9 w-9 rounded-xl sm:h-10 sm:w-10"
              />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-black tracking-tight text-slate-950 sm:text-2xl">
                Dr. IA — Simulador Clínico
              </h1>
              <p className="hidden text-sm text-muted-foreground sm:block">
                Anamnese, triagem educacional e raciocínio clínico em uma experiência premium.
              </p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs font-bold text-emerald-700 shadow-sm sm:flex">
            <CheckCircle2 className="h-4 w-4" />
            Modo educacional seguro
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-3 pb-10 pt-4 sm:px-6 lg:px-8 lg:pt-8">
        <section className="mb-5 grid gap-4 lg:mb-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-2xl shadow-sky-900/10 backdrop-blur-xl sm:p-8">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-primary to-violet-400" />
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Clínica simulada com IA
            </div>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Anamnese mais clara, rápida e elegante no mobile.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Fluxo otimizado para estudantes e profissionais treinarem hipóteses, sinais de alarme e condutas em casos fictícios, mantendo segurança educacional em primeiro plano.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {clinicalHighlights.map(({ label, icon: Icon }) => (
                <div key={label} className="rounded-2xl border border-slate-200/70 bg-white/70 p-3 shadow-sm">
                  <Icon className="mb-2 h-5 w-5 text-primary" />
                  <p className="text-sm font-bold text-slate-800">{label}</p>
                </div>
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

      <footer className="mx-auto w-full max-w-7xl px-4 pb-[max(env(safe-area-inset-bottom),1rem)] text-center text-xs text-muted-foreground sm:px-6 sm:text-sm">
        AIX8C - @lorenzavolponi - Educação + Medicina + Tecnologia = Sucesso no aprendizado
      </footer>
    </div>
  );
};

export default Index;
