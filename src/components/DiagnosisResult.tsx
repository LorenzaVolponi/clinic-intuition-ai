import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ClinicalAssessment, PatientData } from '@/lib/medicalKnowledge';
import {
  Stethoscope,
  Pill,
  BookOpen,
  Search,
  AlertTriangle,
  RotateCcw,
  User,
  Calendar,
  Users,
  FlaskConical,
  ClipboardCheck,
  Activity,
  Cpu,
} from 'lucide-react';

interface DiagnosisResultProps {
  diagnosis: ClinicalAssessment;
  patientData: PatientData;
  onReset: () => void;
}

export const DiagnosisResult = ({ diagnosis, patientData, onReset }: DiagnosisResultProps) => {
  const getProbabilityColor = (probability: string) => {
    switch (probability.toLowerCase()) {
      case 'alta':
        return 'bg-destructive text-destructive-foreground';
      case 'moderada':
        return 'bg-warning text-warning-foreground';
      case 'baixa':
        return 'bg-success text-success-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getTriageColor = (triageLevel: ClinicalAssessment['triageLevel']) => {
    switch (triageLevel) {
      case 'Emergência':
        return 'bg-destructive text-destructive-foreground';
      case 'Urgente':
        return 'bg-orange-500 text-white';
      case 'Prioritário':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-success text-success-foreground';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <Card className="border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary-soft via-primary-soft/80 to-accent border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl">Resumo do Paciente</CardTitle>
                <CardDescription className="text-sm sm:text-base">Caso analisado pelo sistema Dr. IA</CardDescription>
              </div>
            </div>
            <Button
              onClick={onReset}
              variant="outline"
              size="sm"
              className="gap-2 hover:bg-primary/10 hover:text-primary transition-colors shrink-0"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Novo Caso</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{patientData.name || 'Não informado'}</p>
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

          <Separator />

          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Sintomas relatados</p>
              <div className="bg-gradient-to-r from-muted/50 to-muted p-3 sm:p-4 rounded-lg border border-border/50">
                <p className="text-sm sm:text-base leading-relaxed">{patientData.symptoms}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-lg border p-4 bg-background/70">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">Triagem</p>
                </div>
                <Badge className={getTriageColor(diagnosis.triageLevel)}>{diagnosis.triageLevel}</Badge>
                <p className="text-sm text-muted-foreground mt-2">{diagnosis.triageReason}</p>
              </div>
              <div className="rounded-lg border p-4 bg-background/70">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">Fonte da análise</p>
                </div>
                <p className="text-sm font-medium capitalize">{diagnosis.analysisSource === 'groq' ? 'Groq + base local' : 'Base local'}</p>
                <p className="text-xs text-muted-foreground mt-1">Se a API não estiver configurada, o app mantém fallback seguro e funcional.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {diagnosis.emergencyWarning && (
        <Card className="border-destructive bg-gradient-to-r from-destructive/5 to-red-50/50 shadow-lg animate-pulse">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-destructive/20 rounded-full">
                <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-destructive text-lg sm:text-xl mb-3 flex items-center gap-2">🚨 ALERTA DE EMERGÊNCIA</h3>
                <p className="text-destructive/90 text-sm sm:text-base leading-relaxed">{diagnosis.emergencyWarning}</p>
                <div className="mt-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <p className="text-xs sm:text-sm font-medium text-destructive">📞 Em caso de emergência real: SAMU 192 | Bombeiros 193</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm border-primary/15">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Resumo clínico</CardTitle>
          <CardDescription>{diagnosis.clinicalSummary}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border bg-primary-soft/30 p-4">
            <div className="flex items-center gap-2 mb-3">
              <FlaskConical className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Exames sugeridos</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {diagnosis.suggestedExams.map((exam) => (
                <Badge key={exam} variant="secondary" className="text-xs">{exam}</Badge>
              ))}
            </div>
          </div>

          <div className="rounded-lg border bg-success-soft/40 p-4">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardCheck className="h-4 w-4 text-success" />
              <h3 className="font-semibold">Ações imediatas</h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
              {diagnosis.immediateActions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4 sm:space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          Análise diagnóstica
        </h2>

        {diagnosis.hypotheses.map((hypothesis, index) => (
          <Card key={`${hypothesis.name}-${index}`} className="border-l-4 border-l-primary shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <CardTitle className="text-lg sm:text-xl flex items-start gap-2 leading-tight">
                    <span className="text-2xl">🩺</span>
                    <div>
                      <div className="font-bold">Hipótese {index + 1}</div>
                      <div className="text-base sm:text-lg font-semibold text-primary">{hypothesis.name}</div>
                    </div>
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={`${getProbabilityColor(hypothesis.probability)} text-xs sm:text-sm`}>{hypothesis.probability}</Badge>
                  <Badge variant="outline" className="text-xs">Score {hypothesis.score}</Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              <div className="bg-success-soft p-3 sm:p-4 rounded-lg border border-success/20">
                <div className="flex items-start gap-3">
                  <Pill className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-success mb-2 text-sm sm:text-base">💊 Possível conduta terapêutica</h4>
                    <p className="text-success/90 text-sm leading-relaxed">{hypothesis.treatment}</p>
                  </div>
                </div>
              </div>

              <div className="bg-primary-soft p-3 sm:p-4 rounded-lg border border-primary/20">
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-primary mb-2 text-sm sm:text-base">📌 Explicação clínica</h4>
                    <p className="text-primary/90 text-sm leading-relaxed">{hypothesis.explanation}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="bg-accent p-3 sm:p-4 rounded-lg border border-accent/20">
                  <div className="flex items-start gap-3">
                    <Search className="h-5 w-5 text-accent-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-accent-foreground mb-3 text-sm sm:text-base">🔍 Diagnósticos diferenciais</h4>
                      <div className="flex flex-wrap gap-2">
                        {hypothesis.differentials.map((diff) => (
                          <Badge key={diff} variant="outline" className="text-xs py-1 px-2">{diff}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 p-3 sm:p-4 rounded-lg border border-border/70">
                  <h4 className="font-semibold mb-3 text-sm sm:text-base">🧪 Exames e red flags</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium mb-2">Exames</p>
                      <div className="flex flex-wrap gap-2">
                        {hypothesis.recommendedExams.map((exam) => (
                          <Badge key={exam} variant="secondary" className="text-xs">{exam}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium mb-2">Sinais de alarme</p>
                      <div className="flex flex-wrap gap-2">
                        {hypothesis.redFlags.map((flag) => (
                          <Badge key={flag} variant="outline" className="text-xs border-destructive/30 text-destructive">{flag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-r from-warning-soft/50 to-orange-50/50 border-warning shadow-lg">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-warning/20 rounded-full">
              <AlertTriangle className="h-6 w-6 text-warning flex-shrink-0" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-warning text-lg sm:text-xl mb-3">⚠️ Aviso educacional importante</h3>
              <p className="text-warning/90 leading-relaxed text-sm sm:text-base">
                Este simulador é uma ferramenta <strong>exclusivamente educacional</strong>. As sugestões apresentadas não constituem diagnóstico médico definitivo nem prescrição terapêutica. Sempre consulte um profissional qualificado antes de tomar qualquer decisão clínica real.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
