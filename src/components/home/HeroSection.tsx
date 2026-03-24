import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AiHealthStatus } from '@/lib/aiClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ClipboardList, Flame, HeartPulse, LucideIcon, Sparkles } from 'lucide-react';

interface StudyStat {
  label: string;
  value: string;
  icon: LucideIcon;
}

interface HeroSectionProps {
  unlockedAchievements: number;
  achievementTotal: number;
  studyStats: StudyStat[];
  aiHealthStatus: AiHealthStatus;
  onExploreCases: () => void;
  onTalkMedBot: () => void;
}

export const HeroSection = ({
  unlockedAchievements,
  achievementTotal,
  studyStats,
  aiHealthStatus,
  onExploreCases,
  onTalkMedBot,
}: HeroSectionProps) => {
  return (
    <section id="inicio" className="relative overflow-hidden px-4 pb-8 pt-8 sm:pt-12">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        {Array.from({ length: 10 }).map((_, index) => (
          <span
            key={index}
            className="absolute h-16 w-3 rounded-full bg-gradient-to-b from-cyan-200/30 to-violet-200/30"
            style={{
              left: `${8 + index * 9}%`,
              top: `${(index * 11) % 80}%`,
              transform: `rotate(${index % 2 === 0 ? 12 : -18}deg)`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-lg">
              <HeartPulse className="h-7 w-7" />
            </div>
            <div>
              <div className="bg-gradient-to-r from-cyan-500 to-violet-500 bg-clip-text text-3xl font-black tracking-tight text-transparent">
                MedInnova
              </div>
              <div className="text-sm font-medium text-slate-500">AI Lab • diagnóstico educacional, estudo e revisão guiada</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-warning px-4 py-2 text-sm font-bold text-warning-foreground shadow-lg">
              {unlockedAchievements} conquistas
            </div>
            <Badge className={aiHealthStatus.providerConfigured ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
              {aiHealthStatus.providerConfigured ? `IA ativa${aiHealthStatus.model ? ` (${aiHealthStatus.model})` : ''}` : 'Modo local (sem chave IA)'}
            </Badge>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="relative z-10 text-center lg:text-left">
            <h1 className="text-4xl font-black leading-none tracking-tight sm:text-6xl lg:text-7xl">
              <span className="bg-gradient-to-r from-cyan-500 via-emerald-500 to-violet-500 bg-clip-text text-transparent">MedInnova</span>
              <br />
              <span className="text-slate-900">AI Lab</span>
            </h1>
            <p className="mt-6 max-w-4xl text-xl font-semibold leading-snug text-slate-600 sm:text-3xl">
              Explore como a <span className="text-cyan-500">Inteligência Artificial</span> e inovações tecnológicas estão
              <span className="text-emerald-500"> transformando a medicina</span> e salvando milhões de vidas.
            </p>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-500 sm:text-lg">
              Um laboratório educacional completo para diagnosticar casos simulados, revisar por flashcards, conversar com um tutor inteligente e navegar pela evolução da medicina.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button
                size="lg"
                onClick={onExploreCases}
                className="h-14 w-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-8 text-base font-bold shadow-xl sm:w-auto sm:text-lg"
              >
                <ClipboardList className="mr-2 h-5 w-5" />
                Explorar Casos Clínicos
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={onTalkMedBot}
                className="h-14 w-full rounded-full border-[3px] border-violet-400 px-8 text-base font-bold text-cyan-600 shadow-xl sm:w-auto sm:text-lg"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Conversar com MedBot
              </Button>
            </div>
          </div>

          <Card className="relative overflow-hidden rounded-[28px] border-white/70 bg-white/80 shadow-[0_25px_70px_-35px_rgba(59,130,246,0.4)] backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-500 p-3 text-white">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>O que o sistema faz</CardTitle>
                  <CardDescription>Diagnóstico educacional + estudo ativo em um único fluxo.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {studyStats.map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-primary-soft p-2 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-slate-600">{label}</span>
                  </div>
                  <span className="text-xl font-black text-slate-900">{value}</span>
                </div>
              ))}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
                  <div className="text-sm font-bold text-cyan-700">Diagnosticar</div>
                  <p className="mt-2 text-sm text-slate-600">Triagem, hipóteses, exames sugeridos e red flags para casos simulados.</p>
                </div>
                <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                  <div className="text-sm font-bold text-violet-700">Estudar</div>
                  <p className="mt-2 text-sm text-slate-600">Flashcards, quiz, MedBot e timeline interativa por tema.</p>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-cyan-50 p-4">
                <div className="mb-2 flex items-center gap-2 font-semibold text-slate-800">
                  <Flame className="h-4 w-4 text-warning" />
                  Progresso da sessão
                </div>
                <Progress value={(unlockedAchievements / achievementTotal) * 100} className="h-3" />
                <p className="mt-2 text-sm text-slate-500">Desbloqueie conquistas usando quiz, timeline, MedBot e análise de casos.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
