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
    const symptoms = data.symptoms.toLowerCase();
    
    if (symptoms.includes("dor no peito") || symptoms.includes("dor torácica")) {
      return {
        hypotheses: [
          {
            name: "Síndrome Coronariana Aguda",
            probability: "Alta",
            treatment: "Antiagregação plaquetária, anticoagulação (exemplos educacionais)",
            explanation: "Dor torácica em paciente com fatores de risco pode indicar isquemia miocárdica.",
            differentials: ["Pericardite", "Embolia pulmonar", "Dissecção aórtica"]
          }
        ],
        emergencyWarning: "Este quadro pode representar uma emergência médica. Encaminhe para atendimento imediato."
      };
    }
    
    if (symptoms.includes("dor abdominal") || symptoms.includes("dor na barriga")) {
      return {
        hypotheses: [
          {
            name: "Apendicite Aguda",
            probability: "Moderada",
            treatment: "Antibióticos (ceftriaxona), analgesia (dipirona) - exemplos educacionais",
            explanation: "Dor abdominal em paciente jovem, especialmente se migratória para fossa ilíaca direita.",
            differentials: ["Gastroenterite", "Doença inflamatória pélvica", "Litíase urinária"]
          },
          {
            name: "Gastroenterite Aguda",
            probability: "Moderada",
            treatment: "Hidratação, probióticos, dieta - exemplos educacionais",
            explanation: "Quadro gastroentérico viral ou bacteriano comum.",
            differentials: ["Intoxicação alimentar", "Doença de Crohn", "Colite"]
          }
        ]
      };
    }

    if (symptoms.includes("tosse") || symptoms.includes("febre")) {
      return {
        hypotheses: [
          {
            name: "Infecção Respiratória Viral",
            probability: "Alta",
            treatment: "Sintomáticos, hidratação, repouso - exemplos educacionais",
            explanation: "Quadro viral típico com tosse e febre de início recente.",
            differentials: ["Pneumonia bacteriana", "COVID-19", "Bronquite aguda"]
          }
        ]
      };
    }

    return {
      hypotheses: [
        {
          name: "Quadro Inespecífico",
          probability: "Baixa",
          treatment: "Observação clínica, sintomáticos - exemplos educacionais",
          explanation: "Sintomas pouco específicos requerem avaliação clínica mais detalhada.",
          differentials: ["Diversas patologias possíveis", "Necessária anamnese expandida"]
        }
      ]
    };
  };

  const handleReset = () => {
    setPatientData(null);
    setDiagnosis(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg">
              <Stethoscope className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Dr. IA</h1>
              <p className="text-primary-foreground/90">Simulador de Diagnóstico Interativo</p>
            </div>
          </div>
        </div>
      </header>

      {/* Safety Warning */}
      <SafetyWarning />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Introduction */}
          {!patientData && (
            <Card className="p-8 bg-gradient-to-r from-card to-accent border-l-4 border-l-primary">
              <div className="text-center space-y-4">
                <div className="flex justify-center gap-4 mb-6">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Brain className="h-8 w-8 text-primary" />
                  </div>
                  <div className="p-3 bg-success/10 rounded-full">
                    <BookOpen className="h-8 w-8 text-success" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-foreground">
                  Bem-vindo ao Dr. IA
                </h2>
                <p className="text-muted-foreground text-lg max-w-2xl">
                  Ferramenta educacional para estudantes de medicina praticarem raciocínio clínico 
                  através de casos simulados com inteligência artificial.
                </p>
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