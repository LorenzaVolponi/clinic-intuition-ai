import { AlertTriangle, BookOpen, Users, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const SafetyWarning = () => {
  return (
    <Card className="h-full overflow-hidden border-amber-200/80 bg-white/85 shadow-2xl shadow-amber-900/10 backdrop-blur-xl">
      <div className="h-1 bg-gradient-to-r from-amber-300 via-warning to-orange-400" />
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-warning/15 text-warning ring-1 ring-warning/20">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h2 className="flex items-center gap-2 text-lg font-black text-slate-950 sm:text-xl">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Uso educacional seguro
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Simulador para treinamento clínico. Não substitui avaliação médica real.
              </p>
            </div>
          </div>

          <div className="grid gap-3 text-sm sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-3">
              <div className="mb-1 flex items-center gap-2 font-bold text-amber-800">
                <BookOpen className="h-4 w-4" />
                Finalidade didática
              </div>
              <p className="text-amber-900/75">Treino de raciocínio para casos fictícios e estudos supervisionados.</p>
            </div>

            <div className="rounded-2xl border border-orange-100 bg-orange-50/70 p-3">
              <div className="mb-1 flex items-center gap-2 font-bold text-orange-800">
                <AlertTriangle className="h-4 w-4" />
                Não é diagnóstico
              </div>
              <p className="text-orange-900/75">Sugestões não são prescrição, diagnóstico definitivo ou conduta real.</p>
            </div>

            <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-3">
              <div className="mb-1 flex items-center gap-2 font-bold text-rose-800">
                <Users className="h-4 w-4" />
                Emergências
              </div>
              <p className="text-rose-900/75">Sintomas reais graves: procure atendimento imediato ou ligue 192 (SAMU).</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
