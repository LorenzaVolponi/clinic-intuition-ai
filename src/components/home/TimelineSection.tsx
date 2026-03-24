import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TimelineMilestone } from '@/lib/studyContent';

interface TimelineSectionProps {
  timeline: TimelineMilestone[];
  timelineIndex: number;
  onSelectTimeline: (index: number) => void;
}

export const TimelineSection = ({ timeline, timelineIndex, onSelectTimeline }: TimelineSectionProps) => {
  return (
    <section id="timeline" className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <Badge className="mb-3 bg-sky-100 text-sky-700 hover:bg-sky-100">Timeline</Badge>
        <h2 className="text-3xl font-black text-slate-900">Linha do tempo da evolução médica.</h2>
        <p className="mt-2 max-w-3xl text-slate-500">
          Clique em qualquer marco para abrir mais detalhes e conectar o passado da medicina com o presente da IA aplicada ao estudo.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-lg">
          <CardContent className="p-6">
            <div className="relative ml-3 border-l-4 border-cyan-200 pl-8">
              {timeline.map((milestone, index) => (
                <button
                  key={milestone.year}
                  onClick={() => onSelectTimeline(index)}
                  className="relative mb-6 block w-full text-left last:mb-0"
                >
                  <span className={`absolute -left-[2.55rem] top-2 h-5 w-5 rounded-full border-4 border-white ${index === timelineIndex ? 'bg-cyan-500' : 'bg-violet-300'}`} />
                  <div className={`rounded-3xl border p-4 transition ${index === timelineIndex ? 'border-cyan-300 bg-cyan-50' : 'border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/40'}`}>
                    <div className="text-sm font-black tracking-[0.3em] text-slate-400">{milestone.year}</div>
                    <div className="mt-1 text-xl font-bold text-slate-900">{milestone.title}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{milestone.summary}</p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-lg">
          <CardHeader>
            <CardTitle>{timeline[timelineIndex].title}</CardTitle>
            <CardDescription>{timeline[timelineIndex].year}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-slate-600">
            <p>{timeline[timelineIndex].details}</p>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <strong className="text-slate-900">Impacto:</strong> {timeline[timelineIndex].impact}
            </div>
            <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
              <strong className="text-slate-900">Conexão com o estudo atual:</strong> use este marco para criar analogias, perguntas de prova e narrativas de memória durante a revisão.
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
