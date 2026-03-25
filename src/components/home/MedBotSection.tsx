import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { AiHealthStatus } from '@/lib/aiClient';
import { StudyTopic } from '@/lib/studyContent';
import { ChatMessage } from '@/types/study';
import { Bot, MessageSquareText } from 'lucide-react';

interface MedBotSectionProps {
  selectedTopic: StudyTopic;
  medbotMessages: ChatMessage[];
  medbotInput: string;
  isMedbotLoading: boolean;
  aiHealthStatus: AiHealthStatus;
  onInputChange: (value: string) => void;
  onAskMedBot: (question?: string) => void;
}

export const MedBotSection = ({
  selectedTopic,
  medbotMessages,
  medbotInput,
  isMedbotLoading,
  aiHealthStatus,
  onInputChange,
  onAskMedBot,
}: MedBotSectionProps) => {
  const triggerHaptic = (ms = 10) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(ms);
    }
  };

  return (
    <section id="medbot" className="container mx-auto max-w-6xl px-4 py-8 pb-[max(env(safe-area-inset-bottom),1rem)]">
      <div className="mb-6">
        <Badge className="mb-3 bg-violet-100 text-violet-700 hover:bg-violet-100">MedBot</Badge>
        <h2 className="text-3xl font-black text-slate-900">Tutor de estudo conversacional.</h2>
        <p className="mt-2 max-w-3xl text-slate-500">
          Peça resumos, perguntas, comparações e mini planos de estudo. Sem API configurada, ele continua funcional com respostas locais orientadas por tema.
        </p>
        <Badge className={`mt-3 ${aiHealthStatus.providerConfigured ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} hover:opacity-100`}>
          {aiHealthStatus.providerConfigured ? `IA online${aiHealthStatus.model ? ` • ${aiHealthStatus.model}` : ''}` : 'IA externa offline • fallback local ativo'}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="rounded-[24px] border-white/70 bg-white/90 shadow-lg sm:rounded-[28px]">
          <CardHeader>
            <CardTitle>Prompts rápidos</CardTitle>
            <CardDescription>Ideias para começar sem travar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedTopic.medbotPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => {
                  triggerHaptic(10);
                  onAskMedBot(prompt);
                }}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 sm:p-4"
              >
                {prompt}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border-white/70 bg-white/90 shadow-lg sm:rounded-[28px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-violet-500" />
              Conversa com o MedBot
            </CardTitle>
            <CardDescription>Foco atual: {selectedTopic.title}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-[360px] space-y-3 overflow-auto rounded-3xl border border-slate-200/70 bg-slate-50/80 p-3 sm:p-4">
              {medbotMessages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`max-w-[90%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm ${
                    message.role === 'assistant'
                      ? 'bg-white text-slate-700'
                      : 'ml-auto bg-gradient-to-r from-cyan-500 to-violet-500 text-white'
                  }`}
                >
                  <div className="whitespace-pre-line">{message.content}</div>
                  {message.source && message.role === 'assistant' && (
                    <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Fonte: {message.source === 'local' ? 'Fallback local estruturado' : 'Modelo Groq + validação'}
                    </div>
                  )}
                  {message.role === 'assistant' && message.suggestions?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.suggestions.slice(0, 3).map((suggestion) => (
                        <button
                          key={`${suggestion}-${index}`}
                          onClick={() => onInputChange(suggestion)}
                          className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-cyan-400 hover:text-cyan-700"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {message.intent && message.role === 'assistant' && (
                    <div className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-violet-400">Intent detectada: {message.intent}</div>
                  )}
                </div>
              ))}
              {isMedbotLoading && (
                <div className="max-w-[90%] rounded-3xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                  <div className="mb-2 h-3 w-40 animate-pulse rounded bg-slate-200" />
                  <div className="mb-2 h-3 w-full animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-slate-200" />
                  <p className="mt-3 text-xs text-slate-500">Pensando como médico...</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Textarea
                value={medbotInput}
                onChange={(event) => onInputChange(event.target.value)}
                placeholder="Ex.: gere 5 perguntas de revisão sobre pneumonia, compare ITU baixa vs pielonefrite, crie plano de 15 minutos..."
                className="min-h-[110px] rounded-3xl bg-white"
              />
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button onClick={() => onAskMedBot()} className="h-11 flex-1 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 text-sm font-bold sm:h-12 sm:text-base">
                  <MessageSquareText className="mr-2 h-4 w-4" />
                  Perguntar ao MedBot
                </Button>
                <Button variant="outline" onClick={() => onInputChange(selectedTopic.medbotPrompts[0])} className="h-11 rounded-full px-5 text-sm font-semibold sm:h-12 sm:px-6 sm:text-base">
                  Usar sugestão
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
