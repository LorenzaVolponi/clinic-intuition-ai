import { useEffect, useMemo, useState } from 'react';
import { AiHealthStatus, askMedBot, analyzeClinicalCase, generateStudyPack, getAiHealthStatus } from '@/lib/aiClient';
import { ClinicalAssessment, PatientData } from '@/lib/medicalKnowledge';
import { GeneratedStudyPack, MEDICAL_TIMELINE, STUDY_TOPICS, getTopicById } from '@/lib/studyContent';
import { AchievementsSection } from '@/components/home/AchievementsSection';
import { ClinicalCasesSection } from '@/components/home/ClinicalCasesSection';
import { HeroSection } from '@/components/home/HeroSection';
import { MedBotSection } from '@/components/home/MedBotSection';
import { StudySection } from '@/components/home/StudySection';
import { TimelineSection } from '@/components/home/TimelineSection';
import { TopicGridSection } from '@/components/home/TopicGridSection';
import { Milestone, NotebookTabs, Target, Trophy } from 'lucide-react';
import { AchievementItem, ChatMessage } from '@/types/study';

const LOCAL_STORAGE_KEYS = {
  selectedTopicId: 'medinnova:selectedTopicId',
  medbotMessages: 'medinnova:medbotMessages',
  timelineIndex: 'medinnova:timelineIndex',
  studyPackCachePrefix: 'medinnova:studyPack:',
};

const DEFAULT_MEDBOT_MESSAGE: ChatMessage = {
  role: 'assistant',
  content:
    '👋 Olá! Sou o MedBot, seu assistente de estudos médicos.\n\nPosso te ajudar com:\n• 📚 resumos rápidos\n• 🏥 casos clínicos\n• 📝 quiz interativo\n• 💊 farmacologia\n• ⚠️ red flags\n\nQual tema você quer dominar hoje? 🚀',
  source: 'local',
  suggestions: ['resumo sepse', 'caso clínico IAM', 'quiz AVC'],
  intent: 'duvida',
};

const Index = () => {
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [diagnosis, setDiagnosis] = useState<ClinicalAssessment | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState(STUDY_TOPICS[0].id);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [timelineIndex, setTimelineIndex] = useState(0);
  const [timelineClicks, setTimelineClicks] = useState<number[]>([0]);
  const [medbotInput, setMedbotInput] = useState('');
  const [isMedbotLoading, setIsMedbotLoading] = useState(false);
  const [medbotMessages, setMedbotMessages] = useState<ChatMessage[]>([DEFAULT_MEDBOT_MESSAGE]);
  const [generatedStudyPack, setGeneratedStudyPack] = useState<GeneratedStudyPack | null>(null);
  const [isGeneratingStudyPack, setIsGeneratingStudyPack] = useState(false);
  const [aiHealthStatus, setAiHealthStatus] = useState<AiHealthStatus>({ ok: false, providerConfigured: false });
  const [isOffline, setIsOffline] = useState(false);

  const selectedTopic = useMemo(() => getTopicById(selectedTopicId), [selectedTopicId]);
  const quizScore = selectedTopic.quiz.reduce((score, question, index) => {
    return selectedAnswers[index] === question.answer ? score + 1 : score;
  }, 0);

  useEffect(() => {
    setIsOffline(typeof navigator !== 'undefined' ? !navigator.onLine : false);
    const onOffline = () => setIsOffline(true);
    const onOnline = () => setIsOffline(false);
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  useEffect(() => {
    const loadAiHealth = async () => {
      const status = await getAiHealthStatus();
      setAiHealthStatus(status);
    };

    loadAiHealth();
  }, []);

  useEffect(() => {
    try {
      const persistedTopic = localStorage.getItem(LOCAL_STORAGE_KEYS.selectedTopicId);
      const persistedMessages = localStorage.getItem(LOCAL_STORAGE_KEYS.medbotMessages);
      const persistedTimelineIndex = localStorage.getItem(LOCAL_STORAGE_KEYS.timelineIndex);

      if (persistedTopic && STUDY_TOPICS.some((topic) => topic.id === persistedTopic)) {
        setSelectedTopicId(persistedTopic);
      }

      if (persistedMessages) {
        const parsed = JSON.parse(persistedMessages) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMedbotMessages(parsed);
        }
      }

      if (persistedTimelineIndex) {
        const index = Number(persistedTimelineIndex);
        if (!Number.isNaN(index) && index >= 0 && index < MEDICAL_TIMELINE.length) {
          setTimelineIndex(index);
        }
      }
    } catch (error) {
      console.warn('Falha ao restaurar estado local.', error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.selectedTopicId, selectedTopicId);
  }, [selectedTopicId]);

  useEffect(() => {
    const loadStudyPack = async () => {
      setIsGeneratingStudyPack(true);
      try {
        const cacheKey = `${LOCAL_STORAGE_KEYS.studyPackCachePrefix}${selectedTopicId}`;
        const cachedPack = localStorage.getItem(cacheKey);
        if (isOffline && cachedPack) {
          try {
            setGeneratedStudyPack(JSON.parse(cachedPack) as GeneratedStudyPack);
            return;
          } catch (error) {
            console.warn('Cache local de estudo inválido. Regerando conteúdo.', error);
          }
        }

        const pack = await generateStudyPack(selectedTopicId);
        setGeneratedStudyPack(pack);
        localStorage.setItem(cacheKey, JSON.stringify(pack));
      } finally {
        setIsGeneratingStudyPack(false);
      }
    };

    loadStudyPack();
  }, [isOffline, selectedTopicId]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.medbotMessages, JSON.stringify(medbotMessages.slice(-20)));
  }, [medbotMessages]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.timelineIndex, String(timelineIndex));
  }, [timelineIndex]);

  useEffect(() => {
    setFlashcardIndex(0);
    setFlashcardFlipped(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
  }, [selectedTopicId]);

  const handleFormSubmit = async (data: PatientData) => {
    setIsAnalyzing(true);
    setPatientData(data);
    try {
      const nextDiagnosis = await analyzeClinicalCase(data, { topicId: selectedTopicId, objective: selectedTopic.objective });
      setDiagnosis(nextDiagnosis);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setPatientData(null);
    setDiagnosis(null);
  };

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleAskMedBot = async (question?: string) => {
    if (isMedbotLoading) return;

    const content = (question ?? medbotInput).trim();
    if (!content) return;

    const nextHistory = [...medbotMessages, { role: 'user' as const, content }];
    setMedbotMessages(nextHistory);
    setMedbotInput('');
    setIsMedbotLoading(true);

    try {
      const response = await askMedBot(
        content,
        selectedTopicId,
        nextHistory.map(({ role, content: messageContent }) => ({ role, content: messageContent })),
        {
          objective: selectedTopic.objective,
          quickFacts: selectedTopic.quickFacts,
          clinicalSummary: diagnosis?.clinicalSummary,
          userLevel: 'intermediario',
        },
      );

      setMedbotMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: response.answer,
          source: response.source,
          suggestions: response.suggestions,
          intent: response.intent,
        },
      ]);
    } finally {
      setIsMedbotLoading(false);
    }
  };

  const achievements = useMemo<AchievementItem[]>(() => {
    const cardsViewed = flashcardIndex + (flashcardFlipped ? 1 : 0);
    const timelineUnlocked = new Set(timelineClicks).size;

    return [
      {
        title: 'Explorador de casos',
        description: diagnosis ? 'Você já analisou um caso clínico nesta sessão.' : 'Analise um caso clínico para desbloquear.',
        unlocked: Boolean(diagnosis),
      },
      {
        title: 'Mestre dos flashcards',
        description: cardsViewed >= 2 ? 'Você revisou múltiplos cartões do tema atual.' : 'Vire e avance flashcards para consolidar memória ativa.',
        unlocked: cardsViewed >= 2,
      },
      {
        title: 'Quiz runner',
        description: Object.keys(selectedAnswers).length >= selectedTopic.quiz.length ? 'Quiz concluído no tema atual.' : 'Responda todo o quiz para desbloquear.',
        unlocked: Object.keys(selectedAnswers).length >= selectedTopic.quiz.length,
      },
      {
        title: 'Cronista da medicina',
        description: timelineUnlocked >= 2 ? 'Você explorou múltiplos marcos da timeline médica.' : 'Clique em marcos da timeline para desbloquear.',
        unlocked: timelineUnlocked >= 2,
      },
      {
        title: 'Parceiro do MedBot',
        description: medbotMessages.length > 2 ? 'Você já estudou com o MedBot nesta sessão.' : 'Converse com o MedBot para desbloquear.',
        unlocked: medbotMessages.length > 2,
      },
    ];
  }, [diagnosis, flashcardFlipped, flashcardIndex, medbotMessages.length, selectedAnswers, selectedTopic.quiz.length, timelineClicks]);

  const unlockedAchievements = achievements.filter((achievement) => achievement.unlocked).length;
  const studyStats = [
    { label: 'Temas disponíveis', value: `${STUDY_TOPICS.length}`, icon: NotebookTabs },
    { label: 'Marcos na timeline', value: `${MEDICAL_TIMELINE.length}`, icon: Milestone },
    { label: 'Questões ativas', value: `${selectedTopic.quiz.length}`, icon: Target },
    { label: 'Conquistas', value: `${unlockedAchievements}/${achievements.length}`, icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.98),_rgba(240,247,255,0.95)_55%,_rgba(232,244,255,0.9)_100%)] pb-[max(env(safe-area-inset-bottom),1rem)] text-foreground">
      <main>
        {isOffline && (
          <div className="mx-auto mt-3 w-full max-w-6xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Modo offline: conteúdo limitado. Conecte-se para IA ao vivo.
          </div>
        )}
        <HeroSection
          unlockedAchievements={unlockedAchievements}
          achievementTotal={achievements.length}
          studyStats={studyStats}
          aiHealthStatus={aiHealthStatus}
          onExploreCases={() => scrollToSection('casos')}
          onTalkMedBot={() => scrollToSection('medbot')}
        />

        <TopicGridSection
          topics={STUDY_TOPICS}
          onSelectTopic={(topicId) => setSelectedTopicId(topicId)}
          onAfterSelect={() => scrollToSection('quiz')}
        />

        <ClinicalCasesSection
          selectedTopic={selectedTopic}
          diagnosis={diagnosis}
          patientData={patientData}
          isAnalyzing={isAnalyzing}
          onSubmit={handleFormSubmit}
          onReset={handleReset}
        />

        <MedBotSection
          selectedTopic={selectedTopic}
          medbotMessages={medbotMessages}
          medbotInput={medbotInput}
          isMedbotLoading={isMedbotLoading}
          aiHealthStatus={aiHealthStatus}
          onInputChange={setMedbotInput}
          onAskMedBot={handleAskMedBot}
        />

        <StudySection
          topics={STUDY_TOPICS}
          selectedTopic={selectedTopic}
          selectedTopicId={selectedTopicId}
          onSelectTopic={(topicId) => setSelectedTopicId(topicId)}
          flashcardIndex={flashcardIndex}
          flashcardFlipped={flashcardFlipped}
          onFlipFlashcard={() => setFlashcardFlipped((current) => !current)}
          onPrevFlashcard={() => {
            setFlashcardIndex((current) => (current === 0 ? selectedTopic.flashcards.length - 1 : current - 1));
            setFlashcardFlipped(false);
          }}
          onNextFlashcard={() => {
            setFlashcardIndex((current) => (current === selectedTopic.flashcards.length - 1 ? 0 : current + 1));
            setFlashcardFlipped(false);
          }}
          currentQuestionIndex={currentQuestionIndex}
          selectedAnswers={selectedAnswers}
          quizScore={quizScore}
          onSelectAnswer={(option) => setSelectedAnswers((current) => ({ ...current, [currentQuestionIndex]: option }))}
          onPrevQuestion={() => setCurrentQuestionIndex((current) => (current === 0 ? 0 : current - 1))}
          onNextQuestion={() => setCurrentQuestionIndex((current) => (current === selectedTopic.quiz.length - 1 ? 0 : current + 1))}
          generatedStudyPack={generatedStudyPack}
          isGeneratingStudyPack={isGeneratingStudyPack}
          onRegenerateStudyPack={async () => {
            setIsGeneratingStudyPack(true);
            try {
              const pack = await generateStudyPack(selectedTopicId);
              setGeneratedStudyPack(pack);
            } finally {
              setIsGeneratingStudyPack(false);
            }
          }}
        />

        <TimelineSection
          timeline={MEDICAL_TIMELINE}
          timelineIndex={timelineIndex}
          onSelectTimeline={(index) => {
            setTimelineIndex(index);
            setTimelineClicks((current) => [...current, index]);
          }}
        />

        <AchievementsSection achievements={achievements} unlockedAchievements={unlockedAchievements} />
      </main>
    </div>
  );
};

export default Index;
