import { useState } from "react";
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, UserCheck, ClipboardList, Stethoscope } from "lucide-react";

interface PatientData {
  name: string;
  age: number;
  gender: string;
  symptoms: string;
  duration: string;
}

interface PatientFormProps {
  onSubmit: (data: PatientData) => Promise<void>;
  isAnalyzing: boolean;
  patientData: PatientData | null;
}

const SYMPTOM_CATEGORIES = {
  cardiovascular: [
    "Dor torácica", "Palpitações", "Dispneia", "Edema de membros inferiores", 
    "Síncope", "Cianose", "Claudicação intermitente"
  ],
  respiratorio: [
    "Tosse seca", "Tosse produtiva", "Dispneia aos esforços", "Dispneia de repouso",
    "Hemoptise", "Dor pleurítica", "Sibilos"
  ],
  gastrointestinal: [
    "Dor epigástrica", "Dor em hipocôndrio direito", "Dor em fossa ilíaca direita",
    "Náuseas", "Vômitos", "Diarreia", "Constipação", "Melena", "Hematoquezia"
  ],
  neurologico: [
    "Cefaleia", "Tontura", "Vertigem", "Parestesias", "Paresia", "Convulsões",
    "Alteração da consciência", "Distúrbios visuais"
  ],
  genitourinario: [
    "Disúria", "Polaciúria", "Hematúria", "Dor lombar", "Retenção urinária",
    "Oligúria", "Anúria"
  ],
  sistemico: [
    "Febre", "Calafrios", "Sudorese", "Fadiga", "Perda de peso", "Anorexia",
    "Mialgia", "Artralgia"
  ]
};

const DURATION_OPTIONS = [
  { value: "< 6h", label: "Menos de 6 horas", severity: "hiperagudo" },
  { value: "6-24h", label: "6 a 24 horas", severity: "agudo" },
  { value: "1-7d", label: "1 a 7 dias", severity: "agudo" },
  { value: "1-4sem", label: "1 a 4 semanas", severity: "subagudo" },
  { value: "> 4sem", label: "Mais de 4 semanas", severity: "cronico" }
];

export const PatientForm = ({ onSubmit, isAnalyzing, patientData }: PatientFormProps) => {
  const [formData, setFormData] = useState<PatientData>({
    name: "",
    age: 0,
    gender: "",
    symptoms: "",
    duration: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      await onSubmit(formData);
    }
  };

  const addSymptom = (symptom: string) => {
    const currentSymptoms = formData.symptoms;
    const newSymptoms = currentSymptoms 
      ? `${currentSymptoms}, ${symptom}` 
      : symptom;
    setFormData({ ...formData, symptoms: newSymptoms });
  };

  // Mobile detection
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (patientData && isAnalyzing) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <h3 className="text-xl font-semibold">Analisando caso clínico...</h3>
            <p className="text-muted-foreground">
              Processando dados do paciente <strong>{patientData.name}</strong>
            </p>
            <div className="bg-primary-soft p-4 rounded-lg">
              <p className="text-sm">
                <strong>Sintomas:</strong> {patientData.symptoms}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 shadow-lg animate-fade-in">
      <CardHeader className="bg-gradient-to-r from-primary-soft via-primary-soft/80 to-accent border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg">
            <ClipboardList className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg sm:text-xl">Anamnese do Paciente</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Preencha os dados do caso clínico fictício para análise
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Nome do Paciente */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Nome do Paciente (Fictício)
            </Label>
            <Input
              id="name"
              placeholder="Ex: João Silva (caso simulado)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-11 sm:h-12 text-base border-border focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Idade e Gênero */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age" className="text-base font-medium">Idade *</Label>
              <Input
                id="age"
                type="number"
                min="1"
                max="120"
                placeholder="Ex: 35"
                value={formData.age || ""}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                className={`h-11 sm:h-12 text-base focus:ring-2 focus:ring-primary/20 ${errors.age ? "border-destructive" : "border-border"}`}
              />
              {errors.age && <p className="text-sm text-destructive">{errors.age}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender" className="text-base font-medium">Gênero *</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
              >
                <SelectTrigger className={`h-11 sm:h-12 text-base focus:ring-2 focus:ring-primary/20 ${errors.gender ? "border-destructive" : "border-border"}`}>
                  <SelectValue placeholder="Selecione o gênero" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="feminino">Feminino</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                  <SelectItem value="nao-informar">Prefiro não informar</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && <p className="text-sm text-destructive">{errors.gender}</p>}
            </div>
          </div>

          {/* Duração dos Sintomas */}
          <div className="space-y-2">
            <Label htmlFor="duration" className="text-base font-medium">Duração dos Sintomas *</Label>
            <Select
              value={formData.duration}
              onValueChange={(value) => setFormData({ ...formData, duration: value })}
            >
              <SelectTrigger className={`h-11 sm:h-12 text-base focus:ring-2 focus:ring-primary/20 ${errors.duration ? "border-destructive" : "border-border"}`}>
                <SelectValue placeholder="Há quanto tempo os sintomas começaram?" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {DURATION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({option.severity})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.duration && <p className="text-sm text-destructive">{errors.duration}</p>}
          </div>

          {/* Sintomas */}
          <div className="space-y-4">
            <Label htmlFor="symptoms" className="text-base font-medium">Sintomas Apresentados *</Label>
            <Textarea
              id="symptoms"
              placeholder="Descreva detalhadamente os sintomas do paciente..."
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              rows={isMobile ? 3 : 4}
              className={`text-base min-h-[100px] focus:ring-2 focus:ring-primary/20 ${errors.symptoms ? "border-destructive" : "border-border"}`}
            />
            {errors.symptoms && <p className="text-sm text-destructive">{errors.symptoms}</p>}
            
            {/* Sugestões de Sintomas por Sistema */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">Sugestões por sistema:</p>
              
              {/* Category buttons for mobile */}
              {isMobile ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(SYMPTOM_CATEGORIES).map(([category, symptoms]) => (
                      <Button
                        key={category}
                        type="button"
                        variant={activeCategory === category ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveCategory(activeCategory === category ? null : category)}
                        className="h-10 text-xs capitalize"
                      >
                        {category.replace(/([A-Z])/g, ' $1').trim()}
                        <span className="ml-1 text-xs">({symptoms.length})</span>
                      </Button>
                    ))}
                  </div>
                  
                  {/* Active category symptoms */}
                  {activeCategory && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground capitalize font-medium">
                        Sistema {activeCategory}:
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {SYMPTOM_CATEGORIES[activeCategory as keyof typeof SYMPTOM_CATEGORIES].map((symptom) => (
                          <Button
                            key={symptom}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addSymptom(symptom)}
                            className="h-10 text-xs justify-start"
                          >
                            + {symptom}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Desktop view */
                <div className="space-y-3">
                  {Object.entries(SYMPTOM_CATEGORIES).map(([category, symptoms]) => (
                    <div key={category} className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground capitalize">
                        {category.replace(/([A-Z])/g, ' $1').trim()}:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {symptoms.map((symptom) => (
                          <Button
                            key={symptom}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addSymptom(symptom)}
                            className="h-8 text-xs"
                          >
                            + {symptom}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full h-11 sm:h-12 text-base bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Analisando caso clínico...
              </>
            ) : (
              <>
                <Stethoscope className="h-5 w-5 mr-2" />
                Analisar Caso Clínico
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};