import { useState } from 'react';
import { PatientForm } from '@/components/PatientForm';
import { DiagnosisResult } from '@/components/DiagnosisResult';
import { SafetyWarning } from '@/components/SafetyWarning';
import { analyzeClinicalCase } from '@/lib/aiClient';
import { ClinicalAssessment, PatientData } from '@/lib/medicalKnowledge';
import { Stethoscope, Brain, BookOpen, Activity, ShieldCheck, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';

const Index = () => {
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [diagnosis, setDiagnosis] = useState<ClinicalAssessment | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFormSubmit = async (data: PatientData) => {
    setIsAnalyzing(true);
    setPatientData(data);

    const nextDiagnosis = await analyzeClinicalCase(data);
    setDiagnosis(nextDiagnosis);
    setIsAnalyzing(false);
  };

  const handleReset = () => {
    setPatientData(null);
    setDiagnosis(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-accent/20">
      <header className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-white/15 rounded-xl backdrop-blur-sm">
              <Stethoscope className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Dr. IA</h1>
              <p className="text-primary-foreground/90 text-sm sm:text-base">
                Simulador de diagnóstico educacional com triagem inteligente
              </p>
            </div>
          </div>
        </div>
      </header>

      <SafetyWarning />

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">
          {!patientData && (
            <Card className="p-6 sm:p-8 bg-gradient-to-r from-card to-accent border-l-4 border-l-primary">
              <div className="text-center space-y-4">
                <div className="flex justify-center gap-4 mb-6">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  </div>
                  <div className="p-3 bg-success/10 rounded-full">
                    <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-success" />
                  </div>
                  <div className="p-3 bg-warning/10 rounded-full">
                    <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-warning" />
                  </div>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  Versão atualizada do Dr. IA
                </h2>
                <p className="text-muted-foreground text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
                  O sistema agora combina uma base clínica local com suporte opcional à Groq via variável de ambiente,
                  priorização por gravidade, exames sugeridos, ações imediatas e explicações mais úteis para treino de raciocínio clínico.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 text-sm">
                  <div className="bg-primary/5 p-4 rounded-lg text-left">
                    <div className="flex items-center gap-2 font-medium text-primary mb-1">
                      <Activity className="h-4 w-4" /> Triagem estruturada
                    </div>
                    <div className="text-muted-foreground">Classificação entre emergencial, urgente e ambulatorial.</div>
                  </div>
                  <div className="bg-success/5 p-4 rounded-lg text-left">
                    <div className="flex items-center gap-2 font-medium text-success mb-1">
                      <ShieldCheck className="h-4 w-4" /> Segurança reforçada
                    </div>
                    <div className="text-muted-foreground">Red flags, ações imediatas e aviso educacional explícito.</div>
                  </div>
                  <div className="bg-warning/5 p-4 rounded-lg text-left">
                    <div className="flex items-center gap-2 font-medium text-warning mb-1">
                      <Sparkles className="h-4 w-4" /> IA configurável
                    </div>
                    <div className="text-muted-foreground">Sem chave hardcoded; a Groq entra apenas via ambiente.</div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {!diagnosis && (
            <PatientForm onSubmit={handleFormSubmit} isAnalyzing={isAnalyzing} patientData={patientData} />
          )}

          {diagnosis && patientData && (
            <DiagnosisResult diagnosis={diagnosis} patientData={patientData} onReset={handleReset} />
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
