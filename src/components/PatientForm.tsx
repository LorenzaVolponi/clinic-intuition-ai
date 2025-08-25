import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, UserCheck, ClipboardList } from "lucide-react";

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

const SYMPTOM_SUGGESTIONS = [
  "Dor de cabeça",
  "Dor no peito",
  "Dor abdominal", 
  "Febre",
  "Tosse",
  "Náusea",
  "Vômito",
  "Diarreia",
  "Fadiga",
  "Tontura"
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const addSymptom = (symptom: string) => {
    const currentSymptoms = formData.symptoms;
    const newSymptoms = currentSymptoms 
      ? `${currentSymptoms}, ${symptom}` 
      : symptom;
    setFormData({ ...formData, symptoms: newSymptoms });
  };

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
    <Card className="border-primary/20">
      <CardHeader className="bg-gradient-to-r from-primary-soft to-accent border-b">
        <div className="flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-primary" />
          <div>
            <CardTitle className="text-xl">Anamnese do Paciente</CardTitle>
            <CardDescription>
              Preencha os dados do caso clínico fictício para análise
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
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
              className="border-border"
            />
          </div>

          {/* Idade e Gênero */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Idade *</Label>
              <Input
                id="age"
                type="number"
                min="1"
                max="120"
                placeholder="Ex: 35"
                value={formData.age || ""}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                className={errors.age ? "border-destructive" : "border-border"}
              />
              {errors.age && <p className="text-sm text-destructive">{errors.age}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gênero *</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
              >
                <SelectTrigger className={errors.gender ? "border-destructive" : "border-border"}>
                  <SelectValue placeholder="Selecione o gênero" />
                </SelectTrigger>
                <SelectContent>
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
            <Label htmlFor="duration">Duração dos Sintomas *</Label>
            <Select
              value={formData.duration}
              onValueChange={(value) => setFormData({ ...formData, duration: value })}
            >
              <SelectTrigger className={errors.duration ? "border-destructive" : "border-border"}>
                <SelectValue placeholder="Há quanto tempo os sintomas começaram?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="< 24h">Menos de 24 horas</SelectItem>
                <SelectItem value="1-2 dias">1 a 2 dias</SelectItem>
                <SelectItem value="3-7 dias">3 a 7 dias</SelectItem>
                <SelectItem value="> 1 semana">Mais de 1 semana</SelectItem>
                <SelectItem value="> 1 mês">Mais de 1 mês</SelectItem>
              </SelectContent>
            </Select>
            {errors.duration && <p className="text-sm text-destructive">{errors.duration}</p>}
          </div>

          {/* Sintomas */}
          <div className="space-y-2">
            <Label htmlFor="symptoms">Sintomas Apresentados *</Label>
            <Textarea
              id="symptoms"
              placeholder="Descreva detalhadamente os sintomas do paciente..."
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              rows={4}
              className={errors.symptoms ? "border-destructive" : "border-border"}
            />
            {errors.symptoms && <p className="text-sm text-destructive">{errors.symptoms}</p>}
            
            {/* Sugestões de Sintomas */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Sugestões rápidas:</p>
              <div className="flex flex-wrap gap-2">
                {SYMPTOM_SUGGESTIONS.map((symptom) => (
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
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90"
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              "Analisar Caso Clínico"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};