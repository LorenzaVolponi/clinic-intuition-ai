import { useState } from "react";
import { PatientForm } from "@/components/PatientForm";
import { DiagnosisResult } from "@/components/DiagnosisResult";
import { SafetyWarning } from "@/components/SafetyWarning";
import { Stethoscope, Brain, BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";

interface PatientData {
  name: string;
  age: number;
  gender: string;
  symptoms: string;
  duration: string;
}

interface DiagnosisData {
  hypotheses: Array<{
    name: string;
    probability: string;
    treatment: string;
    explanation: string;
    differentials: string[];
  }>;
  emergencyWarning?: string;
}

const Index = () => {
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [diagnosis, setDiagnosis] = useState<DiagnosisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFormSubmit = async (data: PatientData) => {
    setIsAnalyzing(true);
    setPatientData(data);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock diagnosis based on symptoms
    const mockDiagnosis = generateMockDiagnosis(data);
    setDiagnosis(mockDiagnosis);
    setIsAnalyzing(false);
  };

  const generateMockDiagnosis = (data: PatientData): DiagnosisData => {
    // Import medical knowledge
    const { findMatchingConditions, generateClinicalPrompt } = require('@/lib/medicalKnowledge');
    
    const matchingConditions = findMatchingConditions(
      data.symptoms, 
      data.age, 
      data.gender, 
      data.duration
    );

    if (matchingConditions.length === 0) {
      return {
        hypotheses: [
          {
            name: "Quadro Clínico Inespecífico",
            probability: "Baixa",
            treatment: "Observação clínica, reavaliação em 24-48h, sintomáticos conforme necessário",
            explanation: "Sintomas apresentados são pouco específicos. Recomenda-se anamnese mais detalhada, exame físico completo e seguimento clínico para melhor caracterização do quadro.",
            differentials: ["Síndrome viral inespecífica", "Distúrbios funcionais", "Manifestações psicossomáticas", "Patologias em fase inicial"]
          }
        ]
      };
    }

    const hypotheses = matchingConditions.slice(0, 3).map((condition, index) => {
      const probabilityMap = {
        'emergencia': 'Alta',
        'alta': 'Alta', 
        'moderada': 'Moderada',
        'baixa': 'Baixa'
      };

      return {
        name: condition.name,
        probability: probabilityMap[condition.urgencyLevel],
        treatment: `${condition.treatments.slice(0, 2).join(', ')} (exemplos educacionais - sempre consultar protocolo institucional)`,
        explanation: `${condition.clinicalPearls[0] || 'Conduta baseada em apresentação clínica típica'}. Considerar fatores de risco: ${condition.riskFactors.slice(0, 2).join(', ')}.`,
        differentials: condition.differentials.slice(0, 4)
      };
    });

    // Check for emergency conditions
    const hasEmergency = matchingConditions.some(c => c.urgencyLevel === 'emergencia');
    const emergencyWarning = hasEmergency ? 
      "🚨 ATENÇÃO: Este quadro clínico pode representar uma EMERGÊNCIA MÉDICA. Recomenda-se avaliação médica presencial IMEDIATA. Em caso de sintomas graves, procure o pronto-socorro ou ligue 192 (SAMU)." : 
      undefined;

    return {
      hypotheses,
      emergencyWarning
    };
  };

  const handleReset = () => {
    setPatientData(null);
    setDiagnosis(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-accent/20">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-white/15 rounded-xl backdrop-blur-sm">
              <Stethoscope className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Dr. IA</h1>
              <p className="text-primary-foreground/90 text-sm sm:text-base">
                Simulador de Diagnóstico Interativo
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Safety Warning */}
      <SafetyWarning />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">
          
          {/* Introduction */}
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
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  Bem-vindo ao Dr. IA
                </h2>
                <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
                  Sistema educacional avançado para estudantes de medicina praticarem raciocínio clínico 
                  através de casos simulados baseados em conhecimento médico atualizado e guidelines internacionais.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 text-sm">
                  <div className="bg-primary/5 p-3 rounded-lg">
                    <div className="font-medium text-primary">📚 Base Científica</div>
                    <div className="text-muted-foreground">Algoritmos diagnósticos atualizados</div>
                  </div>
                  <div className="bg-success/5 p-3 rounded-lg">
                    <div className="font-medium text-success">🎯 Casos Reais</div>
                    <div className="text-muted-foreground">Simulações baseadas em evidências</div>
                  </div>
                  <div className="bg-warning/5 p-3 rounded-lg">
                    <div className="font-medium text-warning">⚡ Triagem Inteligente</div>
                    <div className="text-muted-foreground">Identificação de emergências</div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Patient Form */}
          {!diagnosis && (
            <PatientForm 
              onSubmit={handleFormSubmit} 
              isAnalyzing={isAnalyzing}
              patientData={patientData}
            />
          )}

          {/* Diagnosis Results */}
          {diagnosis && patientData && (
            <DiagnosisResult 
              diagnosis={diagnosis}
              patientData={patientData}
              onReset={handleReset}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;