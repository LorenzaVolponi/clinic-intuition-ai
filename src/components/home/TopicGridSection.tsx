import { StudyTopic } from '@/lib/studyContent';

interface TopicGridSectionProps {
  topics: StudyTopic[];
  onSelectTopic: (topicId: string) => void;
  onAfterSelect?: () => void;
}

export const TopicGridSection = ({ topics, onSelectTopic, onAfterSelect }: TopicGridSectionProps) => {
  return (
    <section className="container mx-auto grid max-w-6xl gap-4 px-4 pb-6 md:grid-cols-2 xl:grid-cols-4">
      {topics.map((topic) => (
        <button
          key={topic.id}
          onClick={() => {
            onSelectTopic(topic.id);
            onAfterSelect?.();
          }}
          className="rounded-[24px] border border-white/70 bg-white/80 p-5 text-left shadow-md transition hover:-translate-y-1 hover:shadow-xl"
        >
          <div className={`mb-4 inline-flex rounded-2xl bg-gradient-to-r px-4 py-2 text-2xl text-white ${topic.colorClass}`}>
            {topic.icon}
          </div>
          <h3 className="text-lg font-bold text-slate-900">{topic.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{topic.description}</p>
          <p className="mt-3 text-sm font-medium text-cyan-600">Objetivo: {topic.objective}</p>
        </button>
      ))}
    </section>
  );
};
