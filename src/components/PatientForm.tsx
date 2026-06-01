import { lazy, Suspense, useMemo, useState, type FormEvent } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, ClipboardList, Loader2, Mic2, Sparkles, Stethoscope, Target, UserCheck } from "lucide-react";

const VoiceAssistant = lazy(() =>
  import("@/components/voice/VoiceAssistant").then((module) => ({ default: module.VoiceAssistant })),
);

const voiceFallback = (
  <div className="rounded-2xl border border-primary/10 bg-primary-soft/20 p-4 text-sm font-medium text-muted-foreground">
    Preparando ditado clínico...
  </div>
);

interface PatientData {
  name: string;
  age: number;
  gender: string;
  symptoms: string;
  duration: string;
}

interface PatientFormProps {
  onSubmit: (data: PatientData) => void;
  isAnalyzing: boolean;
  patientData: PatientData | null;
}

const SYMPTOM_CATEGORIES = {
  cardiovascular: [
    "Dor torácica",
    "Palpitações",
    "Dispneia",
    "Edema de membros inferiores",
    "Síncope",
    "Cianose",
    "Claudicação intermitente",
  ],
  respiratorio: [
    "Tosse seca",
    "Tosse produtiva",
    "Dispneia aos esforços",
    "Dispneia de repouso",
    "Hemoptise",
    "Dor pleurítica",
    "Sibilos",
  ],
  gastrointestinal: [
    "Dor epigástrica",
    "Dor em hipocôndrio direito",
    "Dor em fossa ilíaca direita",
    "Náuseas",
    "Vômitos",
    "Diarreia",
    "Constipação",
    "Melena",
    "Hematoquezia",
  ],
  neurologico: [
    "Cefaleia",
    "Tontura",
    "Vertigem",
    "Parestesias",
    "Paresia",
    "Convulsões",
    "Alteração da consciência",
    "Distúrbios visuais",
  ],
  genitourinario: [
    "Disúria",
    "Polaciúria",
    "Hematúria",
    "Dor lombar",
    "Retenção urinária",
    "Oligúria",
    "Anúria",
  ],
  sistemico: ["Febre", "Calafrios", "Sudorese", "Fadiga", "Perda de peso", "Anorexia", "Mialgia", "Artralgia"],
};

const CATEGORY_LABELS: Record<keyof typeof SYMPTOM_CATEGORIES, string> = {
  cardiovascular: "Cardio",
  respiratorio: "Resp.",
  gastrointestinal: "Gastro",
  neurologico: "Neuro",
  genitourinario: "GU",
  sistemico: "Sistêmico",
};

const DURATION_OPTIONS = [
  { value: "< 6h", label: "Menos de 6 horas", severity: "hiperagudo" },
  { value: "6-24h", label: "6 a 24 horas", severity: "agudo" },
  { value: "1-7d", label: "1 a 7 dias", severity: "agudo" },
  { value: "1-4sem", label: "1 a 4 semanas", severity: "subagudo" },
  { value: "> 4sem", label: "Mais de 4 semanas", severity: "crônico" },
];

const requiredFields: Array<keyof Pick<PatientData, "age" | "gender" | "symptoms" | "duration">> = [
  "age",
  "gender",
  "symptoms",
  "duration",
];

const QUALITY_CRITERIA = [
  {
    label: "Cronologia",
    hint: "quando começou e como evoluiu",
    patterns: ["início", "iniciou", "começou", "desde", "há ", "evoluiu", "evolução"],
  },
  {
    label: "Intensidade",
    hint: "leve/moderada/intensa ou escala de dor",
    patterns: ["leve", "moderada", "intensa", "forte", "escala", "/10", "nota"],
  },
  {
    label: "Fatores",
    hint: "melhora, piora, gatilhos ou relação com esforço",
    patterns: ["melhora", "piora", "gatilho", "esforço", "repouso", "aliment", "movimento"],
  },
  {
    label: "Associados",
    hint: "sintomas acompanhando a queixa principal",
    patterns: ["associad", "junto", "também", "náuse", "febre", "dispneia", "sudorese", "vômit"],
  },
  {
    label: "Negativos",
    hint: "nega sintomas importantes e red flags ausentes",
    patterns: ["nega", "sem ", "ausência", "não apresenta", "não refere"],
  },
  {
    label: "Contexto",
    hint: "antecedentes, medicações, alergias ou risco",
    patterns: ["anteced", "medica", "alerg", "comorb", "hipert", "diabet", "tabag", "gest"],
  },
];

export const PatientForm = ({ onSubmit, isAnalyzing, patientData }: PatientFormProps) => {
  const [formData, setFormData] = useState<PatientData>({
    name: "",
    age: 0,
    gender: "",
    symptoms: "",
    duration: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeCategory, setActiveCategory] = useState<keyof typeof SYMPTOM_CATEGORIES>("cardiovascular");

  const completion = useMemo(() => {
    const completed = requiredFields.filter((field) => {
      const value = formData[field];
      return typeof value === "number" ? value > 0 : Boolean(value.trim());
    }).length;

    return Math.round((completed / requiredFields.length) * 100);
  }, [formData]);

  const qualityChecks = useMemo(() => {
    const normalizedSymptoms = formData.symptoms.toLowerCase();

    return QUALITY_CRITERIA.map((criterion) => ({
      ...criterion,
      done: criterion.patterns.some((pattern) => normalizedSymptoms.includes(pattern)),
    }));
  }, [formData.symptoms]);

  const qualityScore = useMemo(() => {
    const done = qualityChecks.filter((check) => check.done).length;
    return Math.round((done / qualityChecks.length) * 100);
  }, [qualityChecks]);

  const qualityLabel = qualityScore >= 85 ? "Anamnese elite" : qualityScore >= 55 ? "Boa base clínica" : "Enriqueça o caso";

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.age < 1 || formData.age > 120) {
      newErrors.age = "Idade deve estar entre 1 e 120 anos";
    }

    if (!formData.gender) {
      newErrors.gender = "Selecione o gênero";
    }

    if (!formData.symptoms.trim()) {
      newErrors.symptoms = "Descreva os sintomas";
    }

    if (!formData.duration) {
      newErrors.duration = "Selecione a duração dos sintomas";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const appendSymptomsText = (text: string) => {
    const currentSymptoms = formData.symptoms.trim();
    const nextSymptoms = currentSymptoms ? `${currentSymptoms}, ${text}` : text;
    setFormData({ ...formData, symptoms: nextSymptoms });
  };

  if (patientData && isAnalyzing) {
    return (
      <Card className="overflow-hidden rounded-[2rem] border-primary/20 bg-white/90 shadow-2xl shadow-sky-900/10 backdrop-blur-xl">
        <CardContent className="p-6 sm:p-10">
          <div className="mx-auto max-w-2xl space-y-5 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary-soft text-primary ring-1 ring-primary/15">
              <Loader2 className="h-9 w-9 animate-spin" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-950">Analisando caso clínico...</h3>
              <p className="mt-2 text-muted-foreground">
                Processando dados do paciente <strong>{patientData.name || "fictício"}</strong> com foco educacional.
              </p>
            </div>
            <div className="rounded-3xl border border-primary/10 bg-primary-soft/70 p-4 text-left">
              <p className="text-sm leading-6 text-primary/90">
                <strong>Sintomas:</strong> {patientData.symptoms}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in overflow-hidden rounded-[2rem] border-white/70 bg-white/90 shadow-2xl shadow-sky-900/10 backdrop-blur-xl">
      <CardHeader className="border-b border-slate-200/70 bg-gradient-to-r from-white via-sky-50 to-indigo-50 p-5 sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <Badge variant="outline" className="mb-2 border-primary/20 bg-white/70 text-primary">
                <Sparkles className="mr-1 h-3 w-3" />
                Fluxo premium de anamnese
              </Badge>
              <CardTitle className="text-xl font-black text-slate-950 sm:text-2xl">Anamnese do Paciente</CardTitle>
              <CardDescription className="mt-1 text-sm sm:text-base">
                Preencha o caso clínico fictício com campos amplos, toque confortável e atalhos por sistema.
              </CardDescription>
            </div>
          </div>

          <div className="min-w-[12rem] rounded-2xl border border-slate-200/80 bg-white/80 p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500">
              <span>Completude</span>
              <span>{completion}%</span>
            </div>
            <Progress value={completion} className="h-2.5" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pb-28 sm:p-6 sm:pb-6 lg:p-8">
        <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <UserCheck className="h-4 w-4 text-primary" />
                Nome do paciente (fictício)
              </Label>
              <Input
                id="name"
                autoComplete="off"
                placeholder="Ex: João Silva (caso simulado)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-12 rounded-2xl border-slate-200 bg-white/80 text-base shadow-sm focus-visible:ring-primary/25"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="age" className="text-sm font-bold text-slate-800">Idade *</Label>
                <Input
                  id="age"
                  type="number"
                  min="1"
                  max="120"
                  inputMode="numeric"
                  placeholder="Ex: 35"
                  value={formData.age || ""}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value, 10) || 0 })}
                  className={`h-12 rounded-2xl bg-white/80 text-base shadow-sm focus-visible:ring-primary/25 ${errors.age ? "border-destructive" : "border-slate-200"}`}
                />
                {errors.age && <FieldError message={errors.age} />}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender" className="text-sm font-bold text-slate-800">Gênero *</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger className={`h-12 rounded-2xl bg-white/80 text-base shadow-sm focus:ring-primary/25 ${errors.gender ? "border-destructive" : "border-slate-200"}`}>
                    <SelectValue placeholder="Selecione o gênero" />
                  </SelectTrigger>
                  <SelectContent className="z-50 bg-background">
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                    <SelectItem value="nao-informar">Prefiro não informar</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && <FieldError message={errors.gender} />}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm font-bold text-slate-800">Duração dos sintomas *</Label>
              <Select value={formData.duration} onValueChange={(value) => setFormData({ ...formData, duration: value })}>
                <SelectTrigger className={`h-12 rounded-2xl bg-white/80 text-base shadow-sm focus:ring-primary/25 ${errors.duration ? "border-destructive" : "border-slate-200"}`}>
                  <SelectValue placeholder="Há quanto tempo os sintomas começaram?" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-background">
                  {DURATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                      <span className="ml-2 text-xs text-muted-foreground">({option.severity})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.duration && <FieldError message={errors.duration} />}
            </div>

            <div className="space-y-3">
              <Label htmlFor="symptoms" className="text-sm font-bold text-slate-800">Sintomas apresentados *</Label>
              <Textarea
                id="symptoms"
                placeholder="Descreva sintomas, início, fatores de melhora/piora, antecedentes e contexto do caso fictício..."
                value={formData.symptoms}
                onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                rows={5}
                className={`min-h-[9rem] rounded-3xl bg-white/80 p-4 text-base leading-7 shadow-sm focus-visible:ring-primary/25 ${errors.symptoms ? "border-destructive" : "border-slate-200"}`}
              />
              {errors.symptoms && <FieldError message={errors.symptoms} />}

              <Suspense fallback={voiceFallback}>
                <VoiceAssistant
                  title="Ditado clínico"
                  description="Toque no microfone para ditar sintomas em português. O texto capturado será anexado à anamnese."
                  listenLabel="Falar sintomas"
                  onTranscript={appendSymptomsText}
                  disabled={isAnalyzing}
                />
              </Suspense>
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-[1.75rem] border border-violet-100 bg-gradient-to-br from-white via-violet-50/70 to-sky-50/70 p-4 shadow-lg shadow-violet-900/5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-black text-slate-900">
                    <Target className="h-4 w-4 text-violet-600" />
                    Qualidade da anamnese
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{qualityLabel} • {qualityScore}% de contexto clínico</p>
                </div>
                <Badge variant="outline" className="border-violet-200 bg-white/80 text-violet-700">
                  {qualityChecks.filter((check) => check.done).length}/{qualityChecks.length}
                </Badge>
              </div>
              <Progress value={qualityScore} className="mb-3 h-2.5" />
              <div className="grid gap-2">
                {qualityChecks.map((check) => (
                  <div key={check.label} className="flex items-start gap-2 rounded-2xl border border-white/70 bg-white/70 p-2.5">
                    <CheckCircle2 className={`mt-0.5 h-4 w-4 flex-shrink-0 ${check.done ? "text-emerald-500" : "text-slate-300"}`} />
                    <div>
                      <p className="text-xs font-black text-slate-800">{check.label}</p>
                      <p className="text-[11px] leading-4 text-muted-foreground">{check.hint}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200/80 bg-slate-50/70 p-4 shadow-inner shadow-white">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-slate-900">Sugestões por sistema</p>
                  <p className="text-xs text-muted-foreground">Toque para adicionar sem digitar.</p>
                </div>
                <Mic2 className="h-5 w-5 text-primary" />
              </div>

              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 lg:grid lg:grid-cols-2 lg:overflow-visible">
                {(Object.keys(SYMPTOM_CATEGORIES) as Array<keyof typeof SYMPTOM_CATEGORIES>).map((category) => (
                  <Button
                    key={category}
                    type="button"
                    variant={activeCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveCategory(category)}
                    className="h-10 flex-shrink-0 rounded-full px-4 text-xs font-bold lg:w-full"
                  >
                    {CATEGORY_LABELS[category]}
                    <span className="ml-1 opacity-70">({SYMPTOM_CATEGORIES[category].length})</span>
                  </Button>
                ))}
              </div>

              <div className="mt-3 grid gap-2">
                {SYMPTOM_CATEGORIES[activeCategory].map((symptom) => (
                  <Button
                    key={symptom}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => appendSymptomsText(symptom)}
                    className="min-h-10 justify-start rounded-2xl border-slate-200 bg-white/80 px-3 text-left text-xs font-semibold shadow-sm hover:border-primary/30 hover:bg-primary-soft"
                  >
                    + {symptom}
                  </Button>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-emerald-100 bg-emerald-50/70 p-4 text-sm text-emerald-900">
              <div className="mb-2 flex items-center gap-2 font-black">
                <CheckCircle2 className="h-4 w-4" />
                Dica premium
              </div>
              Inclua cronologia, intensidade, fatores associados e sinais negativos relevantes para enriquecer o raciocínio.
            </div>
          </aside>

          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] backdrop-blur-xl md:static md:col-span-full md:border-0 md:bg-transparent md:p-0">
            <Button
              type="submit"
              className="h-12 w-full rounded-2xl bg-gradient-to-r from-primary via-sky-500 to-cyan-500 text-base font-black shadow-xl shadow-sky-900/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl"
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analisando caso clínico...
                </>
              ) : (
                <>
                  <Stethoscope className="mr-2 h-5 w-5" />
                  Analisar Caso Clínico
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

const FieldError = ({ message }: { message: string }) => (
  <p className="flex items-center gap-1.5 text-sm font-medium text-destructive">
    <AlertCircle className="h-4 w-4" />
    {message}
  </p>
);
