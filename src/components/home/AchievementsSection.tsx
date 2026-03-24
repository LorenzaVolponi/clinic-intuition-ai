import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AchievementItem } from '@/types/study';
import { Trophy } from 'lucide-react';

interface AchievementsSectionProps {
  achievements: AchievementItem[];
  unlockedAchievements: number;
}

export const AchievementsSection = ({ achievements, unlockedAchievements }: AchievementsSectionProps) => {
  return (
    <section id="conquistas" className="container mx-auto max-w-6xl px-4 py-8 pb-14">
      <div className="mb-6">
        <Badge className="mb-3 bg-warning-soft text-warning hover:bg-warning-soft">Conquistas</Badge>
        <h2 className="text-3xl font-black text-slate-900">Gamificação leve para manter constância.</h2>
        <p className="mt-2 max-w-3xl text-slate-500">
          A ideia aqui é simples: estudar fica mais intuitivo quando você enxerga progresso entre revisão, prática clínica e exploração histórica.
        </p>
      </div>

      <div className="mb-6 rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-lg">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Painel de progresso</h3>
            <p className="text-sm text-slate-500">Você desbloqueou {unlockedAchievements} de {achievements.length} conquistas.</p>
          </div>
          <Badge className="bg-gradient-to-r from-cyan-500 to-violet-500 text-white hover:from-cyan-500 hover:to-violet-500">
            Sessão ativa
          </Badge>
        </div>
        <Progress value={(unlockedAchievements / achievements.length) * 100} className="h-3" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {achievements.map((achievement) => (
          <Card key={achievement.title} className={`rounded-[26px] border-white/70 shadow-lg ${achievement.unlocked ? 'bg-white/90' : 'bg-slate-100/70 opacity-90'}`}>
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className={`rounded-2xl p-3 ${achievement.unlocked ? 'bg-warning-soft text-warning' : 'bg-slate-200 text-slate-400'}`}>
                  <Trophy className="h-6 w-6" />
                </div>
                <Badge variant={achievement.unlocked ? 'default' : 'secondary'}>{achievement.unlocked ? 'Desbloqueada' : 'Em progresso'}</Badge>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{achievement.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{achievement.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
