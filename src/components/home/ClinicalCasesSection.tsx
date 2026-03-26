import { DiagnosisResult } from '@/components/DiagnosisResult';
import { PatientForm } from '@/components/PatientForm';
import { SafetyWarning } from '@/components/SafetyWarning';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClinicalAssessment, PatientData } from '@/lib/medicalKnowledge';
import { StudyTopic } from '@/lib/studyContent';
import { Activity, Stethoscope } from 'lucide-react';

interface ClinicalCasesSectionProps {
  selectedTopic: StudyTopic;
  diagnosis: ClinicalAssessment | null;
  patientData: PatientData | null;
  isAnalyzing: boolean;
  onSubmit: (data: PatientData) => void;
  onReset: () => void;
}

export const ClinicalCasesSection = ({
  selectedTopic,
  diagnosis,
  patientData,
  isAnalyzing,
  onSubmit,
  onReset,
}: ClinicalCasesSectionProps) => {
  return (
    <section id="casos" className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/10">Casos clínicos</Badge>
          <h2 className="text-3xl font-black text-slate-900">Simulador clínico preservado e mais integrado ao estudo.</h2>
          <p className="mt-2 max-w-3xl text-slate-500">
            Mantive o sistema de análise funcional e encaixei ele dentro da nova jornada de aprendizagem para você revisar hipótese, red flags, triagem e exames em um fluxo só.
          </p>
        </div>
        <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm">
          <p className="text-sm text-slate-500">Tema em estudo agora</p>
          <p className="font-bold text-slate-900">{selectedTopic.title}</p>
        </div>
      </div>

      <SafetyWarning />

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Stethoscope className="h-6 w-6 text-primary" />
                Modo prática guiada
              </CardTitle>
              <CardDescription>
                Use o tema selecionado como trilha de revisão e depois aplique em um caso clínico fictício.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedTopic.quickFacts.map((fact) => (
                <div key={fact} className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 text-sm leading-6 text-slate-600">
                  {fact}
                </div>
              ))}
            </CardContent>
          </Card>

          {!diagnosis && <PatientForm onSubmit={onSubmit} isAnalyzing={isAnalyzing} patientData={patientData} />}
        </div>

        <div>
          {diagnosis && patientData ? (
            <DiagnosisResult diagnosis={diagnosis} patientData={patientData} onReset={onReset} />
          ) : (
            <Card className="rounded-[28px] border-dashed border-primary/30 bg-white/70 shadow-lg">
              <CardContent className="flex min-h-[420px] flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="rounded-full bg-primary-soft p-5 text-primary">
                  <Activity className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Seu relatório clínico vai aparecer aqui</h3>
                <p className="max-w-xl text-slate-500">
                  Ao enviar um caso, o sistema mostra triagem, hipótese principal, exames sugeridos, ações imediatas e sinais de alarme em um formato mais didático.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
};
