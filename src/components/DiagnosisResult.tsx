import { lazy, Suspense, useMemo, useState, type ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatAssessmentForSpeech } from '@/lib/spokenClinicalFormatter';
import type { ClinicalAssessment, PatientData } from '@/lib/medicalKnowledge';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  FlaskConical,
  Gauge,
  Pill,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';

const VoiceAssistant = lazy(() =>
  import('@/components/voice/VoiceAssistant').then((module) => ({ default: module.VoiceAssistant })),
);

const REGULATORY_REFERENCES = [
  'Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD)',
  'Código de Ética Médica (Resolução CFM nº 2.217/2018)',
  'Telemedicina no Brasil (Resolução CFM nº 2.314/2022)',
];

interface DiagnosisResultProps {
  diagnosis: ClinicalAssessment;
  patientData: PatientData;
  onReset: () => void;
}

const voiceFallback = (
  <div className="rounded-2xl border border-primary/10 bg-primary-soft/20 p-4 text-sm font-medium text-muted-foreground">
    Preparando leitura em voz alta...
  </div>
);

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

const getTriageProgress = (triageLevel: ClinicalAssessment['triageLevel']) => {
  switch (triageLevel) {
    case 'Emergência':
      return 100;
    case 'Urgente':
      return 78;
    case 'Prioritário':
      return 55;
    default:
      return 28;
  }
};

const formatClinicalReport = (diagnosis: ClinicalAssessment, patientData: PatientData) => {
  const hypotheses = diagnosis.hypotheses
    .map((hypothesis, index) => {
      const probability = typeof hypothesis.probabilityPercent === 'number'
        ? `${hypothesis.probability} (${hypothesis.probabilityPercent}%)`
        : hypothesis.probability;

      return [
        `${index + 1}. ${hypothesis.name} — ${probability} | score ${hypothesis.score}`,
        `   Conduta educacional: ${hypothesis.treatment}`,
        `   Exames: ${hypothesis.recommendedExams.join(', ') || 'não informado'}`,
        `   Red flags: ${hypothesis.redFlags.join(', ') || 'não informado'}`,
      ].join('\n');
    })
    .join('\n\n');

  return [
    'Dr. IA — Resumo educacional do caso',
    `Paciente: ${patientData.name || 'Não informado'} | ${patientData.age} anos | ${patientData.gender || 'gênero não informado'} | duração: ${patientData.duration}`,
    `Sintomas: ${patientData.symptoms}`,
    '',
    `Triagem: ${diagnosis.triageLevel}`,
    `Motivo: ${diagnosis.triageReason}`,
    '',
    `Resumo clínico: ${diagnosis.clinicalSummary}`,
    '',
    `Ações imediatas simuladas: ${diagnosis.immediateActions.join('; ') || 'não informado'}`,
    `Exames sugeridos: ${diagnosis.suggestedExams.join('; ') || 'não informado'}`,
    '',
    'Hipóteses:',
    hypotheses || 'Sem hipóteses listadas.',
    '',
    'Aviso: conteúdo exclusivamente educacional; não constitui diagnóstico, prescrição ou conduta médica real.',
  ].join('\n');
};

export const DiagnosisResult = ({ diagnosis, patientData, onReset }: DiagnosisResultProps) => {
  const [copyStatus, setCopyStatus] = useState('');
  const spokenAssessment = formatAssessmentForSpeech(diagnosis, patientData);
  const primaryHypothesis = diagnosis.hypotheses[0];
  const triageProgress = getTriageProgress(diagnosis.triageLevel);
  const clinicalReport = useMemo(() => formatClinicalReport(diagnosis, patientData), [diagnosis, patientData]);

  const summaryStats = [
    { label: 'Hipóteses', value: diagnosis.hypotheses.length, icon: Stethoscope },
    { label: 'Exames', value: diagnosis.suggestedExams.length, icon: FlaskConical },
    { label: 'Ações', value: diagnosis.immediateActions.length, icon: ClipboardCheck },
    { label: 'Alertas', value: diagnosis.validationWarnings?.length || 0, icon: ShieldAlert },
  ];

  const handleCopyReport = async () => {
    if (!navigator.clipboard) {
      setCopyStatus('Cópia indisponível neste navegador.');
      return;
    }

    await navigator.clipboard.writeText(clinicalReport);
    setCopyStatus('Resumo copiado.');
    window.setTimeout(() => setCopyStatus(''), 2200);
  };

  return (
    <div className="animate-fade-in space-y-5 sm:space-y-6">
      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <User className="h-6 w-6" />
              </div>
              <div>
                <Badge variant="outline" className="mb-2 border-slate-200 bg-slate-50 text-slate-600">
                  <Sparkles className="mr-1 h-3 w-3" />
                  Resultado educacional
                </Badge>
                <CardTitle className="text-xl font-semibold text-slate-950 sm:text-2xl">Resumo do Paciente</CardTitle>
                <CardDescription className="mt-1 text-sm sm:text-base">
                  Caso analisado pelo Dr. IA com triagem, hipóteses e próximos passos simulados.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row lg:self-center">
              <Button
                onClick={handleCopyReport}
                variant="outline"
                size="sm"
                className="h-10 rounded-xl border-slate-200 bg-white px-4 font-medium transition-colors hover:bg-primary/10 hover:text-primary"
              >
                {copyStatus ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                {copyStatus ? 'Copiado' : 'Copiar resumo'}
              </Button>
              <Button
                onClick={onReset}
                variant="outline"
                size="sm"
                className="h-10 rounded-xl border-slate-200 bg-white px-4 font-medium transition-colors hover:bg-primary/10 hover:text-primary"
              >
                <RotateCcw className="h-4 w-4" />
                Novo Caso
              </Button>
            </div>
          </div>
          {copyStatus && <p className="mt-3 text-sm font-medium text-emerald-600">{copyStatus}</p>}
        </CardHeader>

        <CardContent className="space-y-5 p-4 sm:p-6 lg:p-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoTile icon={User} label="Nome" value={patientData.name || 'Não informado'} />
            <InfoTile icon={Calendar} label="Idade" value={`${patientData.age} anos`} />
            <InfoTile icon={Users} label="Gênero" value={patientData.gender} capitalize />
            <InfoTile icon={AlertTriangle} label="Duração" value={patientData.duration} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Sintomas relatados</p>
              <p className="text-sm leading-7 text-slate-700 sm:text-base">{patientData.symptoms}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <p className="font-semibold text-slate-900">Triagem</p>
                </div>
                <Badge className={getTriageColor(diagnosis.triageLevel)}>{diagnosis.triageLevel}</Badge>
              </div>
              <Progress value={triageProgress} className="h-2.5" />
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{diagnosis.triageReason}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {summaryStats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
                <Icon className="mb-3 h-5 w-5 text-primary" />
                <p className="text-2xl font-semibold text-slate-950">{value}</p>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {primaryHypothesis && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Hipótese líder</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">{primaryHypothesis.name}</p>
                </div>
                <Badge className={getProbabilityColor(primaryHypothesis.probability)}>
                  {primaryHypothesis.probability}
                  {typeof primaryHypothesis.probabilityPercent === 'number' ? ` ${primaryHypothesis.probabilityPercent}%` : ''}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {diagnosis.emergencyWarning && (
        <Card className="overflow-hidden rounded-2xl border-destructive/30 bg-rose-50 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-destructive sm:text-xl">Alerta de emergência</h3>
                <p className="mt-2 text-sm leading-7 text-destructive/90 sm:text-base">{diagnosis.emergencyWarning}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-200 bg-white p-5 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-950 sm:text-2xl">
            <Gauge className="h-6 w-6 text-primary" />
            Síntese clínica e plano de estudo
          </CardTitle>
          <CardDescription>Resumo narrativo, ações imediatas simuladas, exames sugeridos e conformidade educacional.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 p-4 sm:p-6 lg:grid-cols-2 lg:p-8">
          <InsightCard title="Resumo clínico" icon={BookOpen} tone="primary">
            <p>{diagnosis.clinicalSummary}</p>
          </InsightCard>

          <InsightCard title="Ações imediatas simuladas" icon={ClipboardCheck} tone="success">
            <ListItems items={diagnosis.immediateActions} emptyText="Sem ações imediatas adicionais." />
          </InsightCard>

          <InsightCard title="Exames sugeridos" icon={FlaskConical} tone="neutral">
            <ListItems items={diagnosis.suggestedExams} emptyText="Sem exames adicionais sugeridos." badge />
          </InsightCard>

          <InsightCard title="Referências regulatórias" icon={ShieldAlert} tone="warning">
            <ListItems items={REGULATORY_REFERENCES} emptyText="Sem referências regulatórias." />
          </InsightCard>

          {diagnosis.validationWarnings && diagnosis.validationWarnings.length > 0 && (
            <div className="lg:col-span-2">
              <InsightCard title="Validações de segurança" icon={AlertTriangle} tone="danger">
                <ListItems items={diagnosis.validationWarnings} emptyText="Sem avisos de validação." />
              </InsightCard>
            </div>
          )}

          <div className="lg:col-span-2">
            <Suspense fallback={voiceFallback}>
              <VoiceAssistant
                title="Resumo por voz"
                description="Ouça a síntese clínica simulada em português para revisar o raciocínio sem sair da tela."
                speechText={spokenAssessment}
                speakLabel="Ouvir resumo"
              />
            </Suspense>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {diagnosis.hypotheses.map((hypothesis, index) => {
          const probabilityValue = typeof hypothesis.probabilityPercent === 'number' ? hypothesis.probabilityPercent : hypothesis.score;

          return (
            <Card key={`${hypothesis.name}-${index}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <CardHeader className="border-b border-slate-200 bg-white p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Hipótese {index + 1}</p>
                      <CardTitle className="mt-1 text-lg font-semibold text-primary sm:text-xl">{hypothesis.name}</CardTitle>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={getProbabilityColor(hypothesis.probability)}>
                      {hypothesis.probability}
                      {typeof hypothesis.probabilityPercent === 'number' ? ` ${hypothesis.probabilityPercent}%` : ''}
                    </Badge>
                    <Badge variant="outline" className="bg-white">Score {hypothesis.score}</Badge>
                  </div>
                </div>
                <Progress value={Math.min(Math.max(probabilityValue, 0), 100)} className="mt-4 h-2" />
              </CardHeader>

              <CardContent className="space-y-4 p-4 sm:p-6">
                <div className="grid gap-4 lg:grid-cols-2">
                  <InsightCard title="Possível conduta terapêutica" icon={Pill} tone="success">
                    <p>{hypothesis.treatment}</p>
                    {hypothesis.medicationOptions && hypothesis.medicationOptions.length > 0 && (
                      <ul className="mt-3 list-disc space-y-1 pl-5">
                        {hypothesis.medicationOptions.slice(0, 3).map((option) => (
                          <li key={`${option.name}-${option.why}`}>
                            <strong>{option.name}:</strong> {option.why}
                          </li>
                        ))}
                      </ul>
                    )}
                  </InsightCard>

                  <InsightCard title="Explicação clínica" icon={BookOpen} tone="primary">
                    <p>{hypothesis.explanation}</p>
                  </InsightCard>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <InsightCard title="Diagnósticos diferenciais" icon={Search} tone="neutral">
                    <ListItems items={hypothesis.differentials} emptyText="Sem diferenciais listados." badge />
                  </InsightCard>

                  <InsightCard title="Exames e red flags" icon={AlertTriangle} tone="warning">
                    <div className="space-y-3">
                      <div>
                        <p className="mb-2 font-bold text-slate-800">Exames</p>
                        <ListItems items={hypothesis.recommendedExams} emptyText="Sem exames específicos." badge />
                      </div>
                      <div>
                        <p className="mb-2 font-bold text-slate-800">Sinais de alarme</p>
                        <div className="flex flex-wrap gap-2">
                          {hypothesis.redFlags.map((flag) => (
                            <Badge key={flag} variant="outline" className="border-destructive/30 bg-rose-50 text-destructive">
                              {flag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </InsightCard>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="overflow-hidden rounded-2xl border-warning/40 bg-warning-soft/60 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-warning/20 text-warning">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-warning sm:text-xl">Aviso educacional importante</h3>
              <p className="mt-2 text-sm leading-7 text-warning/90 sm:text-base">
                Este simulador é uma ferramenta <strong>exclusivamente educacional</strong>. As sugestões apresentadas não constituem diagnóstico médico definitivo nem prescrição terapêutica. Sempre consulte um profissional qualificado antes de tomar qualquer decisão clínica real.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface InfoTileProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  capitalize?: boolean;
}

const InfoTile = ({ icon: Icon, label, value, capitalize = false }: InfoTileProps) => (
  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
    <Icon className="h-5 w-5 flex-shrink-0 text-primary" />
    <div className="min-w-0">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`truncate font-bold text-slate-900 ${capitalize ? 'capitalize' : ''}`}>{value}</p>
    </div>
  </div>
);

interface InsightCardProps {
  title: string;
  icon: LucideIcon;
  tone: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
  children: ReactNode;
}

const toneClasses: Record<InsightCardProps['tone'], string> = {
  primary: 'border-primary/15 bg-primary-soft/40 text-primary',
  success: 'border-success/15 bg-success-soft/60 text-success',
  warning: 'border-warning/20 bg-warning-soft/60 text-warning',
  danger: 'border-destructive/20 bg-rose-50 text-destructive',
  neutral: 'border-slate-200/80 bg-slate-50/80 text-slate-700',
};

const InsightCard = ({ title, icon: Icon, tone, children }: InsightCardProps) => (
  <div className={`rounded-xl border p-4 text-sm leading-7 ${toneClasses[tone]}`}>
    <div className="mb-3 flex items-center gap-2 font-semibold">
      <Icon className="h-5 w-5 flex-shrink-0" />
      <h4>{title}</h4>
    </div>
    <div className="text-current/90">{children}</div>
  </div>
);

interface ListItemsProps {
  items: string[];
  emptyText: string;
  badge?: boolean;
}

const ListItems = ({ items, emptyText, badge = false }: ListItemsProps) => {
  if (items.length === 0) {
    return <p className="text-sm opacity-80">{emptyText}</p>;
  }

  if (badge) {
    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item} variant="outline" className="border-current/20 bg-white text-current">
            {item}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
};
