import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneratedStudyPack, StudyTopic } from '@/lib/studyContent';
import { RefreshCcw } from 'lucide-react';

interface StudySectionProps {
  topics: StudyTopic[];
  selectedTopic: StudyTopic;
  selectedTopicId: string;
  onSelectTopic: (topicId: string) => void;
  flashcardIndex: number;
  flashcardFlipped: boolean;
  onFlipFlashcard: () => void;
  onPrevFlashcard: () => void;
  onNextFlashcard: () => void;
  currentQuestionIndex: number;
  selectedAnswers: Record<number, string>;
  quizScore: number;
  onSelectAnswer: (option: string) => void;
  onPrevQuestion: () => void;
  onNextQuestion: () => void;
  generatedStudyPack: GeneratedStudyPack | null;
  isGeneratingStudyPack: boolean;
  aiFlashcardIndex: number;
  aiFlashcardFlipped: boolean;
  onFlipAiFlashcard: () => void;
  onPrevAiFlashcard: () => void;
  onNextAiFlashcard: () => void;
  aiQuizQuestionIndex: number;
  aiSelectedAnswers: Record<number, string>;
  aiQuizScore: number;
  onSelectAiAnswer: (option: string) => void;
  onPrevAiQuestion: () => void;
  onNextAiQuestion: () => void;
  onRegenerateStudyPack: () => void;
}

export const StudySection = ({
  topics,
  selectedTopic,
  selectedTopicId,
  onSelectTopic,
  flashcardIndex,
  flashcardFlipped,
  onFlipFlashcard,
  onPrevFlashcard,
  onNextFlashcard,
  currentQuestionIndex,
  selectedAnswers,
  quizScore,
  onSelectAnswer,
  onPrevQuestion,
  onNextQuestion,
  generatedStudyPack,
  isGeneratingStudyPack,
  aiFlashcardIndex,
  aiFlashcardFlipped,
  onFlipAiFlashcard,
  onPrevAiFlashcard,
  onNextAiFlashcard,
  aiQuizQuestionIndex,
  aiSelectedAnswers,
  aiQuizScore,
  onSelectAiAnswer,
  onPrevAiQuestion,
  onNextAiQuestion,
  onRegenerateStudyPack,
}: StudySectionProps) => {
  const activeFlashcard = selectedTopic.flashcards[flashcardIndex];
  const activeQuestion = selectedTopic.quiz[currentQuestionIndex];
  const currentAnswer = selectedAnswers[currentQuestionIndex];
  const isCurrentCorrect = currentAnswer === activeQuestion.answer;
  const aiFlashcards = generatedStudyPack?.flashcards ?? [];
  const activeAiFlashcard = aiFlashcards[aiFlashcardIndex];
  const aiQuiz = generatedStudyPack?.quiz ?? [];
  const activeAiQuestion = aiQuiz[aiQuizQuestionIndex];
  const currentAiAnswer = aiSelectedAnswers[aiQuizQuestionIndex];
  const isAiCorrect = activeAiQuestion ? currentAiAnswer === activeAiQuestion.answer : false;

  const triggerHaptic = (ms = 12) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(ms);
    }
  };

  return (
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
          {topics.map((topic) => (
            <Button
              key={topic.id}
              variant={topic.id === selectedTopicId ? 'default' : 'outline'}
              onClick={() => onSelectTopic(topic.id)}
              className="rounded-full"
            >
              <span className="mr-2">{topic.icon}</span>
              {topic.title}
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="flashcards" className="space-y-6">
        <TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto rounded-2xl bg-white p-1 shadow-sm sm:justify-center sm:rounded-full">
          <TabsTrigger value="flashcards" className="rounded-full px-4 py-2 text-sm font-semibold sm:py-3 sm:text-base">Flashcards</TabsTrigger>
          <TabsTrigger value="quiz" className="rounded-full px-4 py-2 text-sm font-semibold sm:py-3 sm:text-base">Quiz</TabsTrigger>
          <TabsTrigger value="flashcards-ai" className="rounded-full px-4 py-2 text-sm font-semibold sm:py-3 sm:text-base">Flashcards IA</TabsTrigger>
          <TabsTrigger value="quiz-ai" className="rounded-full px-4 py-2 text-sm font-semibold sm:py-3 sm:text-base">Quiz IA 10</TabsTrigger>
          <TabsTrigger value="aulas" className="rounded-full px-4 py-2 text-sm font-semibold sm:py-3 sm:text-base">Aulas 10</TabsTrigger>
        </TabsList>

        <TabsContent value="flashcards">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-lg">
              <CardContent className="p-6 sm:p-8">
                <button
                  className="flex min-h-[320px] w-full flex-col justify-between rounded-[28px] border border-slate-200/70 bg-gradient-to-br from-white to-cyan-50 p-6 text-left transition hover:shadow-lg"
                  onClick={() => {
                    triggerHaptic(10);
                    onFlipFlashcard();
                  }}
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
                  <Button variant="outline" className="flex-1 rounded-full" onClick={onPrevFlashcard}>Anterior</Button>
                  <Button className="flex-1 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500" onClick={onNextFlashcard}>Próximo</Button>
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

        <TabsContent value="flashcards-ai">
          <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Flashcards gerados por IA</CardTitle>
                <CardDescription>10 cartões novos para revisão ativa em cada geração.</CardDescription>
              </div>
              <Button onClick={onRegenerateStudyPack} disabled={isGeneratingStudyPack} variant="outline" className="rounded-full">
                <RefreshCcw className="mr-2 h-4 w-4" />
                {isGeneratingStudyPack ? 'Gerando...' : 'Gerar novos'}
              </Button>
            </CardHeader>
            <CardContent>
              {!activeAiFlashcard ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">Gerando flashcards IA...</div>
              ) : (
                <>
                  <button
                    className="flex min-h-[280px] w-full flex-col justify-between rounded-[28px] border border-slate-200/70 bg-gradient-to-br from-white to-violet-50 p-6 text-left transition hover:shadow-lg"
                    onClick={() => {
                      triggerHaptic(10);
                      onFlipAiFlashcard();
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">IA {aiFlashcardIndex + 1}/{aiFlashcards.length}</Badge>
                      <span className="text-sm font-medium text-slate-400">Clique para virar</span>
                    </div>
                    <div>
                      <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{aiFlashcardFlipped ? 'Resposta' : 'Pergunta'}</p>
                      <h3 className="mt-4 text-2xl font-black leading-snug text-slate-900">
                        {aiFlashcardFlipped ? activeAiFlashcard.answer : activeAiFlashcard.question}
                      </h3>
                    </div>
                    <div className="rounded-2xl bg-slate-100/80 p-4 text-sm text-slate-500">
                      <strong className="text-slate-700">Dica:</strong> {activeAiFlashcard.hint}
                    </div>
                  </button>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <Button variant="outline" className="flex-1 rounded-full" onClick={onPrevAiFlashcard}>Anterior IA</Button>
                    <Button className="flex-1 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500" onClick={onNextAiFlashcard}>Próximo IA</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quiz">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-lg">
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle id={`quiz-question-${currentQuestionIndex}`}>{activeQuestion.question}</CardTitle>
                    <CardDescription>Pergunta {currentQuestionIndex + 1} de {selectedTopic.quiz.length}.</CardDescription>
                  </div>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Score {quizScore}/{selectedTopic.quiz.length}</Badge>
                </div>
                <Progress value={((currentQuestionIndex + 1) / selectedTopic.quiz.length) * 100} className={`h-3 ${isCurrentCorrect ? 'animate-pulse' : ''}`} />
              </CardHeader>
              <CardContent className="space-y-3">
                <div role="radiogroup" aria-labelledby={`quiz-question-${currentQuestionIndex}`} className="quiz-options grid gap-3">
                  {activeQuestion.options.map((option) => {
                    const selected = selectedAnswers[currentQuestionIndex] === option;
                  const isCorrect = option === activeQuestion.answer;
                  const showEvaluation = selectedAnswers[currentQuestionIndex] !== undefined;

                  return (
                    <button
                      key={option}
                      role="radio"
                      aria-checked={selected}
                      tabIndex={0}
                      onClick={() => {
                        triggerHaptic(selected ? 8 : 18);
                        onSelectAnswer(option);
                      }}
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
                </div>

                {selectedAnswers[currentQuestionIndex] && (
                  <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                    <strong className="text-slate-900">Explicação:</strong> {activeQuestion.explanation}
                  </div>
                )}

                {currentAnswer && !isCurrentCorrect && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    <p className="font-semibold">Por que errei? Fluxo rápido de raciocínio:</p>
                    <ol className="mt-2 list-decimal space-y-1 pl-5">
                      <li>Identifique red flags no cenário clínico.</li>
                      <li>Priorize hipótese de maior risco antes da mais comum.</li>
                      <li>Escolha exame que muda conduta imediata.</li>
                      <li>Reavalie se sua opção responde à pergunta principal.</li>
                    </ol>
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button variant="outline" className="flex-1 rounded-full" onClick={onPrevQuestion}>Pergunta anterior</Button>
                  <Button className="flex-1 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" onClick={onNextQuestion}>Próxima pergunta</Button>
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
                        {selectedAnswers[index] ? `Sua resposta: ${selectedAnswers[index]}` : 'Ainda não respondida.'}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quiz-ai">
          <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Quiz IA interativo (10 perguntas)</CardTitle>
                <CardDescription>Responda uma por vez com feedback imediato e score em tempo real.</CardDescription>
              </div>
              <Button onClick={onRegenerateStudyPack} disabled={isGeneratingStudyPack} className="rounded-full">
                <RefreshCcw className="mr-2 h-4 w-4" />
                {isGeneratingStudyPack ? 'Gerando...' : 'Gerar novo quiz'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {!activeAiQuestion ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">Gerando quiz IA...</div>
              ) : (
                <>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-lg font-bold text-slate-900">{activeAiQuestion.question}</p>
                      <p className="text-sm text-slate-500">Pergunta {aiQuizQuestionIndex + 1} de {aiQuiz.length}</p>
                    </div>
                    <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100">Score IA {aiQuizScore}/{aiQuiz.length || 1}</Badge>
                  </div>
                  <Progress value={((aiQuizQuestionIndex + 1) / (aiQuiz.length || 1)) * 100} className={`h-3 ${isAiCorrect ? 'animate-pulse' : ''}`} />
                  <div className="grid gap-3">
                    {activeAiQuestion.options.map((option) => {
                      const selected = aiSelectedAnswers[aiQuizQuestionIndex] === option;
                      const isCorrect = option === activeAiQuestion.answer;
                      const showEvaluation = aiSelectedAnswers[aiQuizQuestionIndex] !== undefined;
                      return (
                        <button
                          key={`ai-${option}`}
                          onClick={() => {
                            triggerHaptic(selected ? 8 : 18);
                            onSelectAiAnswer(option);
                          }}
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
                  </div>
                  {aiSelectedAnswers[aiQuizQuestionIndex] && (
                    <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                      <strong className="text-slate-900">Explicação IA:</strong> {activeAiQuestion.explanation}
                    </div>
                  )}
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button variant="outline" className="flex-1 rounded-full" onClick={onPrevAiQuestion}>Pergunta IA anterior</Button>
                    <Button className="flex-1 rounded-full bg-gradient-to-r from-violet-500 to-emerald-500" onClick={onNextAiQuestion}>Próxima IA</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aulas">
          <Card className="rounded-[28px] border-white/70 bg-white/85 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>10 aulas rápidas geradas dinamicamente</CardTitle>
                <CardDescription>Conteúdo curto para revisão guiada e prática clínica.</CardDescription>
              </div>
              <Button onClick={onRegenerateStudyPack} disabled={isGeneratingStudyPack} variant="outline" className="rounded-full">
                <RefreshCcw className="mr-2 h-4 w-4" />
                {isGeneratingStudyPack ? 'Atualizando...' : 'Atualizar aulas'}
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {generatedStudyPack?.lessons.map((lesson, index) => (
                <div key={`${lesson.title}-${index}`} className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-900">{lesson.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 whitespace-pre-line">{lesson.content}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
};
