import { AlertTriangle, BookOpen, Users, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const SafetyWarning = () => {
  return (
    <div className="container mx-auto px-4 py-4">
      <Card className="border-warning bg-gradient-to-r from-warning-soft to-warning-soft/50 border-l-4 border-l-warning">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-warning/20 rounded-full flex-shrink-0">
              <Shield className="h-6 w-6 text-warning" />
            </div>
            
            <div className="space-y-4 flex-1">
              <div>
                <h2 className="text-xl font-bold text-warning mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Aviso de Segurança e Uso Educacional
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 text-sm">
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-warning mb-1">
                      Finalidade Educacional
                    </h3>
                    <p className="text-warning/80">
                      Este sistema é destinado exclusivamente ao treinamento de estudantes 
                      de medicina e profissionais da saúde para fins didáticos.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-warning mb-1">
                      Não é Diagnóstico Real
                    </h3>
                    <p className="text-warning/80">
                      As sugestões geradas não constituem diagnóstico médico real 
                      nem substituem avaliação profissional qualificada.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-warning mb-1">
                      Consulte um Médico
                    </h3>
                    <p className="text-warning/80">
                      Para sintomas reais, sempre procure um médico qualificado. 
                      Em emergências, ligue 192 (SAMU) ou dirija-se ao pronto-socorro.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-warning/10 p-3 rounded-lg border border-warning/20">
                <p className="text-warning font-medium text-center">
                  🚨 <strong>EMERGÊNCIAS:</strong> Em caso de sintomas graves como dor no peito, 
                  dificuldade respiratória ou perda de consciência, procure atendimento médico imediato!
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};