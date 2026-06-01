import { AlertTriangle, BookOpen, Shield, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const safetyItems = [
  {
    title: "Didático",
    text: "Treino com casos fictícios.",
    icon: BookOpen,
  },
  {
    title: "Não diagnóstico",
    text: "Não substitui avaliação médica.",
    icon: AlertTriangle,
  },
  {
    title: "Emergência",
    text: "Sintomas reais graves: SAMU 192.",
    icon: Users,
  },
];

export const SafetyWarning = () => {
  return (
    <Card className="h-full rounded-2xl border-amber-200 bg-amber-50/70 shadow-sm">
      <CardContent className="p-4 sm:p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-amber-950">Aviso de segurança</h2>
            <p className="mt-1 text-sm leading-5 text-amber-900/75">Ferramenta exclusivamente educacional.</p>
          </div>
        </div>

        <div className="grid gap-2">
          {safetyItems.map(({ title, text, icon: Icon }) => (
            <div key={title} className="flex items-start gap-2 rounded-xl bg-white/60 p-3 text-sm">
              <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700" />
              <div>
                <p className="font-medium text-amber-950">{title}</p>
                <p className="text-amber-900/75">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
