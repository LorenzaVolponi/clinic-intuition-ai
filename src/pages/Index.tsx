import { useEffect, useMemo, useState } from 'react';
import { PatientForm } from '@/components/PatientForm';
import { DiagnosisResult } from '@/components/DiagnosisResult';
import { SafetyWarning } from '@/components/SafetyWarning';
import { askMedBot, analyzeClinicalCase } from '@/lib/aiClient';
import { ClinicalAssessment, PatientData } from '@/lib/medicalKnowledge';
import { MEDICAL_TIMELINE, STUDY_TOPICS, getTopicById } from '@/lib/studyContent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Activity,
  Brain,
  BookOpen,
  Bot,
  ClipboardList,
  Flame,
  HeartPulse,
  MessageSquareText,
  Milestone,
  NotebookTabs,
  Sparkles,
  Stethoscope,
  Target,
  Trophy,
} from 'lucide-react';

interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
  source?: 'local' | 'groq';
}
import { useState } from 'react';
import { PatientForm } from '@/components/PatientForm';
import { DiagnosisResult } from '@/components/DiagnosisResult';
import { SafetyWarning } from '@/components/SafetyWarning';
import { analyzeClinicalCase } from '@/lib/aiClient';
import { ClinicalAssessment, PatientData } from '@/lib/medicalKnowledge';
import { Stethoscope, Brain, BookOpen, Activity, ShieldCheck, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';

const NAV_ITEMS = [
  { id: 'inicio', label: 'Início', icon: Sparkles },
  { id: 'casos', label: 'Casos', icon: ClipboardList },
  { id: 'medbot', label: 'MedBot', icon: MessageSquareText },
  { id: 'quiz', label: 'Quiz', icon: Target },
  { id: 'timeline', label: 'Timeline', icon: Milestone },
  { id: 'conquistas', label: 'Conquistas', icon: Trophy },
];

const NAV_ITEMS = [
  { id: 'inicio', label: 'Início', icon: Sparkles },
  { id: 'casos', label: 'Casos', icon: ClipboardList },
  { id: 'medbot', label: 'MedBot', icon: MessageSquareText },
  { id: 'quiz', label: 'Quiz', icon: Target },
  { id: 'timeline', label: 'Timeline', icon: Milestone },
  { id: 'conquistas', label: 'Conquistas', icon: Trophy },
];

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
  const [medbotMessages, setMedbotMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Olá! Eu sou o MedBot. Posso resumir temas, montar revisão rápida, comparar diagnósticos e sugerir perguntas de estudo.',
      source: 'local',
    },
  ]);

  const selectedTopic = useMemo(() => getTopicById(selectedTopicId), [selectedTopicId]);
  const activeFlashcard = selectedTopic.flashcards[flashcardIndex];
  const activeQuestion = selectedTopic.quiz[currentQuestionIndex];
  const quizScore = selectedTopic.quiz.reduce((score, question, index) => {
    return selectedAnswers[index] === question.answer ? score + 1 : score;
  }, 0);

  useEffect(() => {
    setFlashcardIndex(0);
    setFlashcardFlipped(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setTimelineIndex(0);
  }, [selectedTopicId]);

  const handleFormSubmit = async (data: PatientData) => {
    setIsAnalyzing(true);
    setPatientData(data);

    const nextDiagnosis = await analyzeClinicalCase(data);
    setDiagnosis(nextDiagnosis);
    setIsAnalyzing(false);
  };

  const handleReset = () => {
    setPatientData(null);
    setDiagnosis(null);
  };

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleAskMedBot = async (question?: string) => {
    const content = (question ?? medbotInput).trim();
    if (!content) return;

    setMedbotMessages((current) => [...current, { role: 'user', content }]);
    setMedbotInput('');
    setIsMedbotLoading(true);

    const response = await askMedBot(
      content,
      selectedTopicId,
      medbotMessages.map(({ role, content: messageContent }) => ({ role, content: messageContent })),
    );
    const response = await askMedBot(content, selectedTopicId);

    setMedbotMessages((current) => [
      ...current,
      {
        role: 'assistant',
        content: response.answer,
        source: response.source,
      },
    ]);
    setIsMedbotLoading(false);
  };

  const achievements = useMemo(() => {
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(235,244,255,0.9)_55%,_rgba(223,239,255,0.85)_100%)] text-foreground">
      <header className="sticky top-0 z-50 border-b border-white/70 bg-white/85 backdrop-blur-xl shadow-[0_10px_35px_-25px_rgba(0,0,0,0.35)]">
        <div className="container mx-auto flex flex-col gap-3 px-4 py-4 xl:flex-row xl:items-center xl:justify-between">
          <button onClick={() => scrollToSection('inicio')} className="flex items-center gap-3 text-left">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-lg">
              <Brain className="h-7 w-7" />
            </div>
            <div>
              <div className="text-3xl font-black tracking-tight bg-gradient-to-r from-cyan-500 to-violet-500 bg-clip-text text-transparent">
                MedInnova
              </div>
              <div className="text-sm font-medium text-slate-500">AI Lab • estudos, casos e revisão guiada</div>
            </div>
            <div>
              <div className="text-3xl font-black tracking-tight bg-gradient-to-r from-cyan-500 to-violet-500 bg-clip-text text-transparent">
                MedInnova
              </div>
              <div className="text-sm font-medium text-slate-500">AI Lab • estudos, casos e revisão guiada</div>
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-accent/20">
      <header className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-3 bg-white/15 rounded-xl backdrop-blur-sm">
              <Stethoscope className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Dr. IA</h1>
              <p className="text-primary-foreground/90 text-sm sm:text-base">
                Simulador de diagnóstico educacional com triagem inteligente
              </p>
            </div>
          </button>

          <nav className="flex flex-wrap items-center gap-2 xl:gap-3">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <Button key={id} variant="ghost" className="gap-2 rounded-full px-4 text-base font-semibold" onClick={() => scrollToSection(id)}>
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            ))}
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning text-warning-foreground font-bold shadow-lg">
              {unlockedAchievements}
            </div>
          </nav>
        </div>
      </header>

      <main>
        <section id="inicio" className="relative overflow-hidden px-4 pb-8 pt-10 sm:pt-16">
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
            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div className="relative z-10 text-center lg:text-left">
                <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-white/85 shadow-[0_18px_60px_-25px_rgba(34,197,94,0.5)] lg:mx-0">
                  <HeartPulse className="h-14 w-14 text-cyan-500" />
                </div>
                <h1 className="text-5xl font-black leading-none tracking-tight sm:text-7xl">
                  <span className="bg-gradient-to-r from-cyan-500 via-emerald-500 to-violet-500 bg-clip-text text-transparent">MedInnova</span>
                  <br />
                  <span className="text-slate-900">AI Lab</span>
                </h1>
                <p className="mt-6 max-w-3xl text-2xl font-semibold leading-snug text-slate-600 sm:text-3xl">
                  Explore como a <span className="text-cyan-500">Inteligência Artificial</span> e inovações tecnológicas estão
                  <span className="text-emerald-500"> transformando a medicina</span> e salvando milhões de vidas.
                </p>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
                  Agora a plataforma reúne simulador clínico, flashcards, quiz temático, MedBot educacional, timeline interativa e conquistas para estudo contínuo.
                </p>

                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Button
                    size="lg"
                    onClick={() => scrollToSection('casos')}
                    className="h-14 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-8 text-lg font-bold shadow-xl"
                  >
                    <ClipboardList className="mr-2 h-5 w-5" />
                    Explorar Casos Clínicos
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => scrollToSection('medbot')}
                    className="h-14 rounded-full border-[3px] border-violet-400 px-8 text-lg font-bold text-cyan-600 shadow-xl"
                  >
                    <MessageSquareText className="mr-2 h-5 w-5" />
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
                      <CardTitle>Hub de estudos médicos</CardTitle>
                      <CardDescription>Uma experiência pensada para memorizar, praticar e revisar.</CardDescription>
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

                  <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-cyan-50 p-4">
                    <div className="mb-2 flex items-center gap-2 font-semibold text-slate-800">
                      <Flame className="h-4 w-4 text-warning" />
                      Progresso da sessão
                    </div>
                    <Progress value={(unlockedAchievements / achievements.length) * 100} className="h-3" />
                    <p className="mt-2 text-sm text-slate-500">Desbloqueie conquistas usando quiz, timeline, MedBot e análise de casos.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="container mx-auto grid max-w-6xl gap-4 px-4 pb-6 md:grid-cols-2 xl:grid-cols-4">
          {STUDY_TOPICS.map((topic) => (
            <button
              key={topic.id}
              onClick={() => {
                setSelectedTopicId(topic.id);
                scrollToSection('quiz');
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

        <section id="casos" className="container mx-auto max-w-6xl px-4 py-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/10">Casos clínicos</Badge>
              <h2 className="text-3xl font-black text-slate-900">Simulador clínico preservado e mais integrado ao estudo.</h2>
              <p className="mt-2 max-w-3xl text-slate-500">
                Mantive o sistema de análise funcional e encaixei ele dentro da nova jornada de aprendizagem para você revisar hipótese, red flags, triagem e exames em um fluxo só.
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm">
              <p className="text-sm text-slate-500">Tema em estudo agora</p>
              <p className="font-bold text-slate-900">{selectedTopic.title}</p>
            </div>
          </div>

          <SafetyWarning />

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-6">
              <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Stethoscope className="h-6 w-6 text-primary" />
                    Modo prática guiada
                  </CardTitle>
                  <CardDescription>
                    Use o tema selecionado como trilha de revisão e depois aplique em um caso clínico fictício.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedTopic.quickFacts.map((fact) => (
                    <div key={fact} className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 text-sm leading-6 text-slate-600">
                      {fact}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {!diagnosis && <PatientForm onSubmit={handleFormSubmit} isAnalyzing={isAnalyzing} patientData={patientData} />}
            </div>

            <div>
              {diagnosis && patientData ? (
                <DiagnosisResult diagnosis={diagnosis} patientData={patientData} onReset={handleReset} />
              ) : (
                <Card className="rounded-[28px] border-dashed border-primary/30 bg-white/70 shadow-lg">
                  <CardContent className="flex min-h-[420px] flex-col items-center justify-center gap-4 p-8 text-center">
                    <div className="rounded-full bg-primary-soft p-5 text-primary">
                      <Activity className="h-10 w-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">Seu relatório clínico vai aparecer aqui</h3>
                    <p className="max-w-xl text-slate-500">
                      Ao enviar um caso, o sistema mostra triagem, hipótese principal, exames sugeridos, ações imediatas e sinais de alarme em um formato mais didático.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>

        <section id="medbot" className="container mx-auto max-w-6xl px-4 py-8">
          <div className="mb-6">
            <Badge className="mb-3 bg-violet-100 text-violet-700 hover:bg-violet-100">MedBot</Badge>
            <h2 className="text-3xl font-black text-slate-900">Tutor de estudo conversacional.</h2>
            <p className="mt-2 max-w-3xl text-slate-500">
              Peça resumos, perguntas, comparações e mini planos de estudo. Sem API configurada, ele continua funcional com respostas locais orientadas por tema.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-lg">
              <CardHeader>
                <CardTitle>Prompts rápidos</CardTitle>
                <CardDescription>Ideias para começar sem travar.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedTopic.medbotPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleAskMedBot(prompt)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50"
                  >
                    {prompt}
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-violet-500" />
                  Conversa com o MedBot
                </CardTitle>
                <CardDescription>Foco atual: {selectedTopic.title}.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-[360px] space-y-3 overflow-auto rounded-3xl border border-slate-200/70 bg-slate-50/80 p-4">
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
                        <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Fonte: {message.source}</div>
                      )}
                    </div>
                  ))}
                  {isMedbotLoading && (
                    <div className="max-w-[90%] rounded-3xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                      MedBot está organizando uma resposta de estudo...
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Textarea
                    value={medbotInput}
                    onChange={(event) => setMedbotInput(event.target.value)}
                    placeholder="Ex.: gere 5 perguntas de revisão sobre pneumonia, compare ITU baixa vs pielonefrite, crie plano de 15 minutos..."
                    className="min-h-[110px] rounded-3xl bg-white"
                  />
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button onClick={() => handleAskMedBot()} className="h-12 flex-1 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 text-base font-bold">
                      <MessageSquareText className="mr-2 h-4 w-4" />
                      Perguntar ao MedBot
                    </Button>
                    <Button variant="outline" onClick={() => setMedbotInput(selectedTopic.medbotPrompts[0])} className="h-12 rounded-full px-6 text-base font-semibold">
                      Usar sugestão
                    </Button>
                </div>
                <h1 className="text-5xl font-black leading-none tracking-tight sm:text-7xl">
                  <span className="bg-gradient-to-r from-cyan-500 via-emerald-500 to-violet-500 bg-clip-text text-transparent">MedInnova</span>
                  <br />
                  <span className="text-slate-900">AI Lab</span>
                </h1>
                <p className="mt-6 max-w-3xl text-2xl font-semibold leading-snug text-slate-600 sm:text-3xl">
                  Explore como a <span className="text-cyan-500">Inteligência Artificial</span> e inovações tecnológicas estão
                  <span className="text-emerald-500"> transformando a medicina</span> e salvando milhões de vidas.
                </p>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
                  Agora a plataforma reúne simulador clínico, flashcards, quiz temático, MedBot educacional, timeline interativa e conquistas para estudo contínuo.
                </p>

                <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                  <Button
                    size="lg"
                    onClick={() => scrollToSection('casos')}
                    className="h-14 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-8 text-lg font-bold shadow-xl"
                  >
                    <ClipboardList className="mr-2 h-5 w-5" />
                    Explorar Casos Clínicos
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => scrollToSection('medbot')}
                    className="h-14 rounded-full border-[3px] border-violet-400 px-8 text-lg font-bold text-cyan-600 shadow-xl"
                  >
                    <MessageSquareText className="mr-2 h-5 w-5" />
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
                      <CardTitle>Hub de estudos médicos</CardTitle>
                      <CardDescription>Uma experiência pensada para memorizar, praticar e revisar.</CardDescription>
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

                  <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-cyan-50 p-4">
                    <div className="mb-2 flex items-center gap-2 font-semibold text-slate-800">
                      <Flame className="h-4 w-4 text-warning" />
                      Progresso da sessão
                    </div>
                    <Progress value={(unlockedAchievements / achievements.length) * 100} className="h-3" />
                    <p className="mt-2 text-sm text-slate-500">Desbloqueie conquistas usando quiz, timeline, MedBot e análise de casos.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="container mx-auto grid max-w-6xl gap-4 px-4 pb-6 md:grid-cols-2 xl:grid-cols-4">
          {STUDY_TOPICS.map((topic) => (
            <button
              key={topic.id}
              onClick={() => {
                setSelectedTopicId(topic.id);
                scrollToSection('quiz');
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

        <section id="casos" className="container mx-auto max-w-6xl px-4 py-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/10">Casos clínicos</Badge>
              <h2 className="text-3xl font-black text-slate-900">Simulador clínico preservado e mais integrado ao estudo.</h2>
              <p className="mt-2 max-w-3xl text-slate-500">
                Mantive o sistema de análise funcional e encaixei ele dentro da nova jornada de aprendizagem para você revisar hipótese, red flags, triagem e exames em um fluxo só.
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm">
              <p className="text-sm text-slate-500">Tema em estudo agora</p>
              <p className="font-bold text-slate-900">{selectedTopic.title}</p>
            </div>
          </div>

          <SafetyWarning />

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-6">
              <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Stethoscope className="h-6 w-6 text-primary" />
                    Modo prática guiada
                  </CardTitle>
                  <CardDescription>
                    Use o tema selecionado como trilha de revisão e depois aplique em um caso clínico fictício.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedTopic.quickFacts.map((fact) => (
                    <div key={fact} className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 text-sm leading-6 text-slate-600">
                      {fact}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {!diagnosis && <PatientForm onSubmit={handleFormSubmit} isAnalyzing={isAnalyzing} patientData={patientData} />}
            </div>

            <div>
              {diagnosis && patientData ? (
                <DiagnosisResult diagnosis={diagnosis} patientData={patientData} onReset={handleReset} />
              ) : (
                <Card className="rounded-[28px] border-dashed border-primary/30 bg-white/70 shadow-lg">
                  <CardContent className="flex min-h-[420px] flex-col items-center justify-center gap-4 p-8 text-center">
                    <div className="rounded-full bg-primary-soft p-5 text-primary">
                      <Activity className="h-10 w-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">Seu relatório clínico vai aparecer aqui</h3>
                    <p className="max-w-xl text-slate-500">
                      Ao enviar um caso, o sistema mostra triagem, hipótese principal, exames sugeridos, ações imediatas e sinais de alarme em um formato mais didático.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>

        <section id="medbot" className="container mx-auto max-w-6xl px-4 py-8">
          <div className="mb-6">
            <Badge className="mb-3 bg-violet-100 text-violet-700 hover:bg-violet-100">MedBot</Badge>
            <h2 className="text-3xl font-black text-slate-900">Tutor de estudo conversacional.</h2>
            <p className="mt-2 max-w-3xl text-slate-500">
              Peça resumos, perguntas, comparações e mini planos de estudo. Sem API configurada, ele continua funcional com respostas locais orientadas por tema.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-lg">
              <CardHeader>
                <CardTitle>Prompts rápidos</CardTitle>
                <CardDescription>Ideias para começar sem travar.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedTopic.medbotPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleAskMedBot(prompt)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50"
                  >
                    {prompt}
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-violet-500" />
                  Conversa com o MedBot
                </CardTitle>
                <CardDescription>Foco atual: {selectedTopic.title}.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-[360px] space-y-3 overflow-auto rounded-3xl border border-slate-200/70 bg-slate-50/80 p-4">
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
                        <div className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Fonte: {message.source}</div>
                      )}
                    </div>
                  ))}
                  {isMedbotLoading && (
                    <div className="max-w-[90%] rounded-3xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                      MedBot está organizando uma resposta de estudo...
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Textarea
                    value={medbotInput}
                    onChange={(event) => setMedbotInput(event.target.value)}
                    placeholder="Ex.: gere 5 perguntas de revisão sobre pneumonia, compare ITU baixa vs pielonefrite, crie plano de 15 minutos..."
                    className="min-h-[110px] rounded-3xl bg-white"
                  />
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button onClick={() => handleAskMedBot()} className="h-12 flex-1 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 text-base font-bold">
                      <MessageSquareText className="mr-2 h-4 w-4" />
                      Perguntar ao MedBot
                    </Button>
                    <Button variant="outline" onClick={() => setMedbotInput(selectedTopic.medbotPrompts[0])} className="h-12 rounded-full px-6 text-base font-semibold">
                      Usar sugestão
                    </Button>
      <SafetyWarning />

      <main className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-fade-in">
          {!patientData && (
            <Card className="p-6 sm:p-8 bg-gradient-to-r from-card to-accent border-l-4 border-l-primary">
              <div className="text-center space-y-4">
                <div className="flex justify-center gap-4 mb-6">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  </div>
                  <div className="p-3 bg-success/10 rounded-full">
                    <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-success" />
                  </div>
                  <div className="p-3 bg-warning/10 rounded-full">
                    <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-warning" />
                  </div>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  Versão atualizada do Dr. IA
                </h2>
                <p className="text-muted-foreground text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
                  O sistema agora combina uma base clínica local com suporte opcional à Groq via variável de ambiente,
                  priorização por gravidade, exames sugeridos, ações imediatas e explicações mais úteis para treino de raciocínio clínico.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 text-sm">
                  <div className="bg-primary/5 p-4 rounded-lg text-left">
                    <div className="flex items-center gap-2 font-medium text-primary mb-1">
                      <Activity className="h-4 w-4" /> Triagem estruturada
                    </div>
                    <div className="text-muted-foreground">Classificação entre emergencial, urgente e ambulatorial.</div>
                  </div>
                  <div className="bg-success/5 p-4 rounded-lg text-left">
                    <div className="flex items-center gap-2 font-medium text-success mb-1">
                      <ShieldCheck className="h-4 w-4" /> Segurança reforçada
                    </div>
                    <div className="text-muted-foreground">Red flags, ações imediatas e aviso educacional explícito.</div>
                  </div>
                  <div className="bg-warning/5 p-4 rounded-lg text-left">
                    <div className="flex items-center gap-2 font-medium text-warning mb-1">
                      <Sparkles className="h-4 w-4" /> IA configurável
                    </div>
                    <div className="text-muted-foreground">Sem chave hardcoded; a Groq entra apenas via ambiente.</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="quiz" className="container mx-auto max-w-6xl px-4 py-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge className="mb-3 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Flashcards + Quiz</Badge>
              <h2 className="text-3xl font-black text-slate-900">Estude com memória ativa e perguntas geradas por tema.</h2>
              <p className="mt-2 max-w-3xl text-slate-500">
                Alternar entre flashcards e quiz torna o estudo mais intuitivo. A seleção do tema reorganiza todo o conteúdo automaticamente.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {STUDY_TOPICS.map((topic) => (
                <Button
                  key={topic.id}
                  variant={topic.id === selectedTopicId ? 'default' : 'outline'}
                  onClick={() => setSelectedTopicId(topic.id)}
                  className="rounded-full"
                >
                  <span className="mr-2">{topic.icon}</span>
                  {topic.title}
                </Button>
              ))}
            </div>
          </div>

          <Tabs defaultValue="flashcards" className="space-y-6">
            <TabsList className="grid h-auto w-full grid-cols-2 rounded-full bg-white p-1 shadow-sm">
              <TabsTrigger value="flashcards" className="rounded-full py-3 text-base font-semibold">Flashcards</TabsTrigger>
              <TabsTrigger value="quiz" className="rounded-full py-3 text-base font-semibold">Quiz</TabsTrigger>
            </TabsList>

            <TabsContent value="flashcards">
              <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-lg">
                  <CardContent className="p-6 sm:p-8">
                    <button
                      className="flex min-h-[320px] w-full flex-col justify-between rounded-[28px] border border-slate-200/70 bg-gradient-to-br from-white to-cyan-50 p-6 text-left transition hover:shadow-lg"
                      onClick={() => setFlashcardFlipped((current) => !current)}
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">Flashcard {flashcardIndex + 1}/{selectedTopic.flashcards.length}</Badge>
                        <span className="text-sm font-medium text-slate-400">Clique para virar</span>
                      </div>

                      <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{flashcardFlipped ? 'Resposta' : 'Pergunta'}</p>
                        <h3 className="mt-4 text-2xl font-black leading-snug text-slate-900">
                          {flashcardFlipped ? activeFlashcard.answer : activeFlashcard.question}
                        </h3>
                      </div>

                      <div className="rounded-2xl bg-slate-100/80 p-4 text-sm text-slate-500">
                        <strong className="text-slate-700">Dica:</strong> {activeFlashcard.hint}
                      </div>
                    </button>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                      <Button
                        variant="outline"
                        className="flex-1 rounded-full"
                        onClick={() => {
                          setFlashcardIndex((current) => (current === 0 ? selectedTopic.flashcards.length - 1 : current - 1));
                          setFlashcardFlipped(false);
                        }}
                      >
                        Anterior
                      </Button>
                      <Button
                        className="flex-1 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500"
                        onClick={() => {
                          setFlashcardIndex((current) => (current === selectedTopic.flashcards.length - 1 ? 0 : current + 1));
                          setFlashcardFlipped(false);
                        }}
                      >
                        Próximo
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-lg">
                  <CardHeader>
                    <CardTitle>{selectedTopic.title}</CardTitle>
                    <CardDescription>{selectedTopic.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedTopic.quickFacts.map((fact) => (
                      <div key={fact} className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                        {fact}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="quiz">
              <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-lg">
                  <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <CardTitle>{activeQuestion.question}</CardTitle>
                        <CardDescription>Pergunta {currentQuestionIndex + 1} de {selectedTopic.quiz.length}.</CardDescription>
                      </div>
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Score {quizScore}/{selectedTopic.quiz.length}</Badge>
                    </div>
                    <Progress value={((currentQuestionIndex + 1) / selectedTopic.quiz.length) * 100} className="h-3" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {activeQuestion.options.map((option) => {
                      const selected = selectedAnswers[currentQuestionIndex] === option;
                      const isCorrect = option === activeQuestion.answer;
                      const showEvaluation = selectedAnswers[currentQuestionIndex] !== undefined;

                      return (
                        <button
                          key={option}
                          onClick={() => setSelectedAnswers((current) => ({ ...current, [currentQuestionIndex]: option }))}
                          className={`w-full rounded-2xl border px-4 py-4 text-left text-sm font-medium transition ${
                            showEvaluation
                              ? isCorrect
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                : selected
                                  ? 'border-red-300 bg-red-50 text-red-700'
                                  : 'border-slate-200 bg-white text-slate-500'
                              : selected
                                ? 'border-cyan-400 bg-cyan-50 text-cyan-700'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50/50'
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}

                    {selectedAnswers[currentQuestionIndex] && (
                      <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                        <strong className="text-slate-900">Explicação:</strong> {activeQuestion.explanation}
                      </div>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button
                        variant="outline"
                        className="flex-1 rounded-full"
                        onClick={() => setCurrentQuestionIndex((current) => (current === 0 ? 0 : current - 1))}
                      >
                        Pergunta anterior
                      </Button>
                      <Button
                        className="flex-1 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                        onClick={() => setCurrentQuestionIndex((current) => (current === selectedTopic.quiz.length - 1 ? 0 : current + 1))}
                      >
                        Próxima pergunta
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-lg">
                  <CardHeader>
                    <CardTitle>Resumo do desempenho</CardTitle>
                    <CardDescription>Veja seu progresso no tema atual.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-slate-500">Taxa de acerto</span>
                        <span className="font-bold text-slate-900">{Math.round((quizScore / selectedTopic.quiz.length) * 100)}%</span>
                      </div>
                      <Progress value={(quizScore / selectedTopic.quiz.length) * 100} className="h-3" />
                    </div>
                    <Separator />
                    {selectedTopic.quiz.map((question, index) => (
                      <div key={question.question} className="flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white p-4">
                        <div className={`mt-1 h-3 w-3 rounded-full ${selectedAnswers[index] === question.answer ? 'bg-emerald-500' : selectedAnswers[index] ? 'bg-red-400' : 'bg-slate-300'}`} />
                        <div>
                          <p className="font-medium text-slate-800">{question.question}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {selectedAnswers[index]
                              ? `Sua resposta: ${selectedAnswers[index]}`
                              : 'Ainda não respondida.'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </section>

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
                  {MEDICAL_TIMELINE.map((milestone, index) => (
                    <button
                      key={milestone.year}
                      onClick={() => {
                        setTimelineIndex(index);
                        setTimelineClicks((current) => [...current, index]);
                      }}
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
                <CardTitle>{MEDICAL_TIMELINE[timelineIndex].title}</CardTitle>
                <CardDescription>{MEDICAL_TIMELINE[timelineIndex].year}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-slate-600">
                <p>{MEDICAL_TIMELINE[timelineIndex].details}</p>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <strong className="text-slate-900">Impacto:</strong> {MEDICAL_TIMELINE[timelineIndex].impact}
                </div>
                <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                  <strong className="text-slate-900">Conexão com o estudo atual:</strong> use este marco para criar analogias, perguntas de prova e narrativas de memória durante a revisão.
                </div>
              </CardContent>
            </Card>
            </Card>

            <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-lg">
              <CardHeader>
                <CardTitle>{MEDICAL_TIMELINE[timelineIndex].title}</CardTitle>
                <CardDescription>{MEDICAL_TIMELINE[timelineIndex].year}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm leading-7 text-slate-600">
                <p>{MEDICAL_TIMELINE[timelineIndex].details}</p>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <strong className="text-slate-900">Impacto:</strong> {MEDICAL_TIMELINE[timelineIndex].impact}
                </div>
                <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                  <strong className="text-slate-900">Conexão com o estudo atual:</strong> use este marco para criar analogias, perguntas de prova e narrativas de memória durante a revisão.
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

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
          )}

          {!diagnosis && (
            <PatientForm onSubmit={handleFormSubmit} isAnalyzing={isAnalyzing} patientData={patientData} />
          )}

          {diagnosis && patientData && (
            <DiagnosisResult diagnosis={diagnosis} patientData={patientData} onReset={handleReset} />
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
