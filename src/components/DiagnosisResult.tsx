import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Stethoscope, 
  Pill, 
  BookOpen, 
  Search, 
  AlertTriangle, 
  RotateCcw,
  User,
  Calendar,
  Users
} from "lucide-react";

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

interface DiagnosisResultProps {
  diagnosis: DiagnosisData;
  patientData: PatientData;
  onReset: () => void;
}

export const DiagnosisResult = ({ diagnosis, patientData, onReset }: DiagnosisResultProps) => {
  const getProbabilityColor = (probability: string) => {
    switch (probability.toLowerCase()) {
      case "alta":
        return "bg-destructive text-destructive-foreground";
      case "moderada":
        return "bg-warning text-warning-foreground";
      case "baixa":
        return "bg-success text-success-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Patient Summary */}
      <Card className="border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary-soft to-accent border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className="text-xl">
                  Resumo do Paciente
                </CardTitle>
                <CardDescription>
                  Dados analisados pelo sistema Dr. IA
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={onReset}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Novo Caso
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{patientData.name || "Não informado"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Idade</p>
                <p className="font-medium">{patientData.age} anos</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Gênero</p>
                <p className="font-medium capitalize">{patientData.gender}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Duração</p>
                <p className="font-medium">{patientData.duration}</p>
              </div>
            </div>
          </div>
          <Separator className="my-4" />
          <div>
            <p className="text-sm text-muted-foreground mb-2">Sintomas Relatados:</p>
            <p className="bg-muted p-3 rounded-lg">{patientData.symptoms}</p>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Warning */}
      {diagnosis.emergencyWarning && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-destructive text-lg mb-2">
                  🚨 Alerta de Emergência
                </h3>
                <p className="text-destructive/90">{diagnosis.emergencyWarning}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diagnosis Hypotheses */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-primary" />
          Análise Diagnóstica
        </h2>
        
        {diagnosis.hypotheses.map((hypothesis, index) => (
          <Card key={index} className="border-l-4 border-l-primary">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-xl flex items-center gap-2">
                    🩺 Hipótese {index + 1}: {hypothesis.name}
                  </CardTitle>
                </div>
                <Badge className={getProbabilityColor(hypothesis.probability)}>
                  Probabilidade: {hypothesis.probability}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Treatment */}
              <div className="bg-success-soft p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <Pill className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-success mb-1">
                      💊 Possível Conduta Terapêutica:
                    </h4>
                    <p className="text-success/90">{hypothesis.treatment}</p>
                  </div>
                </div>
              </div>

              {/* Clinical Explanation */}
              <div className="bg-primary-soft p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <BookOpen className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-primary mb-1">
                      📌 Explicação Clínica:
                    </h4>
                    <p className="text-primary/90">{hypothesis.explanation}</p>
                  </div>
                </div>
              </div>

              {/* Differential Diagnoses */}
              <div className="bg-accent p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <Search className="h-5 w-5 text-accent-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-accent-foreground mb-2">
                      🔍 Diagnósticos Diferenciais:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {hypothesis.differentials.map((diff, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {diff}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {index < diagnosis.hypotheses.length - 1 && <Separator className="my-6" />}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Educational Notice */}
      <Card className="bg-warning-soft border-warning">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-warning mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-warning text-lg mb-2">
                ⚠️ Aviso Educacional Importante
              </h3>
              <p className="text-warning/90 leading-relaxed">
                Este simulador é uma ferramenta <strong>exclusivamente educacional</strong>. 
                As sugestões apresentadas não constituem diagnóstico médico definitivo nem 
                prescrição terapêutica. Sempre consulte um profissional médico qualificado 
                antes de tomar qualquer decisão clínica real.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};