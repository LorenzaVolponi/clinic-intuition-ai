import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { VoiceAssistant } from '@/components/voice/VoiceAssistant';
import { runAssistantCommand, AssistantCommandResult } from '@/lib/assistantOrchestrator';
import { ClinicalAssessment, PatientData } from '@/lib/medicalKnowledge';
import { Bot, Command, Eraser, ListChecks, Search, Siren, Sparkles } from 'lucide-react';

interface ClinicalAssistantPanelProps {
  patientData: PatientData | null;
  diagnosis: ClinicalAssessment | null;
  onReset: () => void;
}

const QUICK_COMMANDS = [
  { label: 'Resumir caso', value: 'resuma o caso', icon: Sparkles },
  { label: 'Red flags', value: 'quais red flags?', icon: Siren },
  { label: 'Exames', value: 'quais exames?', icon: Search },
  { label: 'Ações', value: 'ações imediatas', icon: ListChecks },
];

export const ClinicalAssistantPanel = ({ patientData, diagnosis, onReset }: ClinicalAssistantPanelProps) => {
  const [command, setCommand] = useState('');
  const [lastResult, setLastResult] = useState<AssistantCommandResult | null>(null);

  const executeCommand = (nextCommand = command) => {
    const result = runAssistantCommand(nextCommand, { patientData, diagnosis });
    setLastResult(result);
    setCommand(nextCommand);

    if (result.shouldReset) {
      onReset();
    }
  };

  const handleVoiceCommand = (transcript: string) => {
    executeCommand(transcript);
  };

  const hasAnalyzedCase = Boolean(patientData && diagnosis);

  return (
    <Card className="overflow-hidden border-primary/20 bg-white/90 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary-soft/90 via-white to-accent/60">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge className="mb-2 bg-primary/10 text-primary hover:bg-primary/10">Assistente clínico por voz</Badge>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Bot className="h-5 w-5 text-primary" />
              Modo comando tipo Siri
            </CardTitle>
            <CardDescription className="mt-1">
              Diga ou digite comandos curtos. O assistente usa apenas o caso simulado já analisado e mantém avisos educacionais.
            </CardDescription>
          </div>
          <Badge variant={hasAnalyzedCase ? 'default' : 'secondary'} className="w-fit">
            {hasAnalyzedCase ? 'Caso pronto para comandos' : 'Aguardando análise'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4 sm:p-6">
        <VoiceAssistant
          title="Comando por voz"
          description="Ex.: “resuma o caso”, “quais red flags?”, “quais exames?” ou “novo caso”."
          listenLabel="Falar comando"
          onTranscript={handleVoiceCommand}
          speechText={lastResult?.message}
          speakLabel="Ler resposta"
        />

        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <Textarea
            value={command}
            onChange={(event) => setCommand(event.target.value)}
            placeholder="Digite um comando: resuma o caso, quais red flags, exames, ações imediatas, status do caso, novo caso..."
            className="min-h-[86px] rounded-2xl bg-white"
          />
          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
            <Button type="button" onClick={() => executeCommand()} className="rounded-full">
              <Command className="h-4 w-4" />
              Executar
            </Button>
            <Button type="button" variant="outline" onClick={() => executeCommand('ajuda')} className="rounded-full">
              Ajuda
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {QUICK_COMMANDS.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.value}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => executeCommand(item.value)}
                className="rounded-full"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
          <Button type="button" variant="outline" size="sm" onClick={() => executeCommand('novo caso')} className="rounded-full">
            <Eraser className="h-4 w-4" />
            Novo caso
          </Button>
        </div>

        {lastResult && (
          <div className="rounded-2xl border border-primary/15 bg-primary-soft/20 p-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{lastResult.intent}</Badge>
              <p className="font-semibold text-foreground">{lastResult.title}</p>
            </div>
            <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">{lastResult.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
