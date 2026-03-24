export interface FlashcardItem {
  question: string;
  answer: string;
  hint: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface StudyTopic {
  id: string;
  title: string;
  icon: string;
  colorClass: string;
  description: string;
  objective: string;
  flashcards: FlashcardItem[];
  quiz: QuizQuestion[];
  medbotPrompts: string[];
  quickFacts: string[];
}

export interface TimelineMilestone {
  year: string;
  title: string;
  summary: string;
  details: string;
  impact: string;
}

export interface StudyLesson {
  title: string;
  content: string;
  topicId: string;
}

export interface GeneratedStudyPack {
  topicId: string;
  generatedAt: string;
  lessons: StudyLesson[];
  quiz: QuizQuestion[];
  flashcards: FlashcardItem[];
}

export const STUDY_TOPICS: StudyTopic[] = [
  {
    id: 'emergencias',
    title: 'Emergências clínicas',
    icon: '🚑',
    colorClass: 'from-cyan-500 via-teal-500 to-violet-500',
    description: 'Treine reconhecimento rápido de red flags, triagem e condutas iniciais.',
    objective: 'Priorizar risco, estabilização e decisão de encaminhamento.',
    flashcards: [
      {
        question: 'Quais sinais tornam dor torácica uma emergência até prova em contrário?',
        answer: 'Dor em aperto, irradiação, sudorese, dispneia, síncope, instabilidade hemodinâmica e fatores de risco cardiovasculares elevam a suspeita.',
        hint: 'Pense em síndrome coronariana e dissecção aórtica.',
      },
      {
        question: 'Qual é a prioridade no ABCDE diante de dispneia intensa?',
        answer: 'Garantir via aérea patente, avaliar ventilação/oxigenação, monitorar saturação e iniciar suporte conforme gravidade.',
        hint: 'A letra B deve vir logo após a via aérea.',
      },
      {
        question: 'Quando um déficit neurológico súbito exige protocolo de AVC?',
        answer: 'Sempre que houver início súbito de hemiparesia, afasia, assimetria facial ou rebaixamento do nível de consciência, especialmente dentro da janela terapêutica.',
        hint: 'Tempo é cérebro.',
      },
    ],
    quiz: [
      {
        question: 'Paciente com dor torácica, sudorese e dispneia deve receber qual prioridade inicial?',
        options: ['Ambulatorial', 'Observação domiciliar', 'Avaliação emergencial imediata', 'Retorno em 72h'],
        answer: 'Avaliação emergencial imediata',
        explanation: 'O conjunto sugere síndrome coronariana aguda e requer ECG, monitorização e investigação urgente.',
      },
      {
        question: 'Qual achado é red flag em crise asmática?',
        options: ['Sibilância leve isolada', 'Silêncio auscultatório', 'Tosse seca crônica', 'Rinite alérgica'],
        answer: 'Silêncio auscultatório',
        explanation: 'Silêncio auscultatório pode indicar obstrução grave e fluxo aéreo criticamente reduzido.',
      },
      {
        question: 'Na suspeita de AVC agudo, qual exame costuma ser prioritário na exclusão de sangramento?',
        options: ['EEG', 'TC de crânio', 'Holter 24h', 'USG abdominal'],
        answer: 'TC de crânio',
        explanation: 'A tomografia de crânio é central na avaliação inicial para diferenciar AVC isquêmico de hemorrágico.',
      },
    ],
    medbotPrompts: [
      'Monte um plano de revisão de 20 minutos sobre dor torácica.',
      'Explique red flags em dispneia de forma objetiva.',
      'Compare AVC e hipoglicemia como diagnóstico diferencial inicial.',
    ],
    quickFacts: [
      'ABCDE é a espinha dorsal da abordagem inicial.',
      'Red flags redefinem a prioridade do caso.',
      'Tempo de início muda conduta em AVC e SCA.',
    ],
  },
  {
    id: 'cardiologia',
    title: 'Cardiologia prática',
    icon: '❤️',
    colorClass: 'from-rose-500 via-fuchsia-500 to-indigo-500',
    description: 'Revise síndromes coronarianas, insuficiência cardíaca e interpretação clínica inicial.',
    objective: 'Entender probabilidade pré-teste, sinais de gravidade e exames-chave.',
    flashcards: [
      {
        question: 'Quais achados sugerem insuficiência cardíaca descompensada?',
        answer: 'Dispneia, ortopneia, edema periférico, crepitações bibasais, B3 e ganho de peso por retenção hídrica.',
        hint: 'Pense em congestão pulmonar e sistêmica.',
      },
      {
        question: 'Por que troponina seriada importa na SCA?',
        answer: 'Ela ajuda a detectar lesão miocárdica e a acompanhar a dinâmica de elevação/queda, aumentando a acurácia diagnóstica.',
        hint: 'Uma dosagem isolada pode não bastar.',
      },
      {
        question: 'Qual score é útil para estratificar gravidade em insuficiência cardíaca crônica?',
        answer: 'A classificação funcional da NYHA é muito usada para correlacionar sintomas e limitação funcional.',
        hint: 'Vai de I a IV.',
      },
    ],
    quiz: [
      {
        question: 'Dispneia paroxística noturna é mais compatível com qual quadro?',
        options: ['ITU', 'Insuficiência cardíaca', 'Gastroenterite', 'Meningite'],
        answer: 'Insuficiência cardíaca',
        explanation: 'É um sintoma clássico de congestão pulmonar associada à insuficiência cardíaca.',
      },
      {
        question: 'Qual exame não pode faltar na avaliação inicial de dor torácica aguda?',
        options: ['ECG', 'Densitometria óssea', 'Colonoscopia', 'Audiometria'],
        answer: 'ECG',
        explanation: 'O eletrocardiograma deve ser obtido rapidamente, especialmente na suspeita de síndrome coronariana.',
      },
      {
        question: 'B3 audível é um achado que sugere:',
        options: ['Hipovolemia pura', 'Sobrecarga ventricular', 'Otite média', 'Hipotireoidismo isolado'],
        answer: 'Sobrecarga ventricular',
        explanation: 'A terceira bulha está associada a enchimento ventricular aumentado e pode aparecer na insuficiência cardíaca.',
      },
    ],
    medbotPrompts: [
      'Explique em tabela a diferença entre angina estável e SCA.',
      'Crie 5 perguntas de revisão sobre insuficiência cardíaca.',
      'Resuma como interpretar os primeiros exames em dor torácica.',
    ],
    quickFacts: [
      'ECG precoce muda desfecho em SCA.',
      'Dispneia pode ser equivalente anginoso.',
      'Troponina deve ser contextualizada com história e ECG.',
    ],
  },
  {
    id: 'infectologia',
    title: 'Infectologia e síndromes febris',
    icon: '🦠',
    colorClass: 'from-emerald-500 via-cyan-500 to-blue-500',
    description: 'Organize raciocínio para pneumonia, COVID-19, sepse e infecções urinárias.',
    objective: 'Diferenciar infecção localizada, sistêmica e critérios de gravidade.',
    flashcards: [
      {
        question: 'Quais dados elevam gravidade de pneumonia comunitária?',
        answer: 'Hipotensão, confusão mental, FR elevada, hipoxemia, idade avançada e escore CURB-65 alto.',
        hint: 'Pense em critérios de internação.',
      },
      {
        question: 'Quando suspeitar de pielonefrite em vez de ITU baixa?',
        answer: 'Quando há febre, dor lombar, náuseas/vômitos, mal-estar sistêmico e sinais de acometimento do trato urinário superior.',
        hint: 'Sinais sistêmicos importam.',
      },
      {
        question: 'Qual é a lógica inicial da avaliação de sepse?',
        answer: 'Reconhecer disfunção orgânica, colher exames/lactato, iniciar antibiótico oportuno e ressuscitação conforme perfusão.',
        hint: 'Tempo também importa aqui.',
      },
    ],
    quiz: [
      {
        question: 'Confusão mental em pneumonia sugere qual conduta?',
        options: ['Baixa prioridade', 'Maior vigilância e estratificação de gravidade', 'Apenas sintomático domiciliar', 'Sem relevância clínica'],
        answer: 'Maior vigilância e estratificação de gravidade',
        explanation: 'Confusão mental entra como critério de gravidade em diversos contextos infecciosos.',
      },
      {
        question: 'Febre + dor lombar + disúria aponta mais para:',
        options: ['Cefaleia tensional', 'Pielonefrite', 'Asma', 'AVC'],
        answer: 'Pielonefrite',
        explanation: 'A tríade sugere infecção alta do trato urinário.',
      },
      {
        question: 'Na suspeita de sepse, qual desses é um objetivo inicial?',
        options: ['Adiar antibiótico até 48h', 'Avaliar perfusão e disfunção orgânica', 'Evitar sinais vitais', 'Suspender toda investigação'],
        answer: 'Avaliar perfusão e disfunção orgânica',
        explanation: 'Sepse exige abordagem estruturada, com reconhecimento precoce da gravidade.',
      },
    ],
    medbotPrompts: [
      'Monte um mapa mental de pneumonia comunitária.',
      'Explique como diferenciar ITU baixa de pielonefrite.',
      'Crie 3 casos rápidos de síndrome febril para revisão.',
    ],
    quickFacts: [
      'Infecção + disfunção orgânica muda o patamar do caso.',
      'Oximetria é simples e muito valiosa em quadros respiratórios.',
      'Localização da infecção orienta hipótese e exames.',
    ],
  },
  {
    id: 'neurologia',
    title: 'Neurologia clínica',
    icon: '🧠',
    colorClass: 'from-violet-500 via-fuchsia-500 to-sky-500',
    description: 'Fortaleça a revisão de AVC, cefaleias e déficit neurológico focal.',
    objective: 'Reconhecer padrões de início súbito e sinais de alarme.',
    flashcards: [
      {
        question: 'O que diferencia cefaleia tensional de cefaleia secundária grave?',
        answer: 'Cefaleia secundária grave costuma trazer início súbito, déficit neurológico, febre, rigidez nucal ou alteração do nível de consciência.',
        hint: 'SNOOP ajuda a lembrar sinais de alarme.',
      },
      {
        question: 'Por que glicemia capilar é obrigatória no déficit focal agudo?',
        answer: 'Hipoglicemia pode simular AVC e é reversível rapidamente, por isso deve ser excluída cedo.',
        hint: 'Diagnóstico diferencial tempo-dependente.',
      },
      {
        question: 'Qual o valor de identificar a hora do “último bem” no AVC?',
        answer: 'Ela define elegibilidade para terapias tempo-dependentes e impacta diretamente a conduta aguda.',
        hint: 'Janela terapêutica.',
      },
    ],
    quiz: [
      {
        question: 'Fraqueza unilateral de início súbito deve ser vista inicialmente como:',
        options: ['Quadro ambulatorial simples', 'Possível AVC até avaliação adequada', 'Somatização isolada', 'Gastroenterite'],
        answer: 'Possível AVC até avaliação adequada',
        explanation: 'O déficit focal súbito é red flag neurológica maior.',
      },
      {
        question: 'Qual exame simples pode evitar falso diagnóstico de AVC?',
        options: ['Glicemia capilar', 'Espirometria', 'Ecografia pélvica', 'Colonoscopia'],
        answer: 'Glicemia capilar',
        explanation: 'Hipoglicemia pode imitar déficit neurológico focal.',
      },
      {
        question: 'Cefaleia com febre e rigidez nucal sugere:',
        options: ['Alto risco e necessidade de investigação urgente', 'Baixo risco', 'Somente observação em casa', 'Condição benigna obrigatória'],
        answer: 'Alto risco e necessidade de investigação urgente',
        explanation: 'Esse conjunto exige exclusão de causas infecciosas/meníngeas.',
      },
    ],
    medbotPrompts: [
      'Explique AVC isquêmico vs hemorrágico em linguagem de revisão rápida.',
      'Crie flashcards de cefaleias com sinais de alarme.',
      'Me dê um checklist de atendimento inicial do déficit focal.',
    ],
    quickFacts: [
      'Tempo de início é dado crítico em neurologia aguda.',
      'Hipoglicemia é imitadora clássica de AVC.',
      'Sinais meníngeos mudam urgência imediatamente.',
    ],
  },
];

export const MEDICAL_TIMELINE: TimelineMilestone[] = [
  {
    year: '1895',
    title: 'Descoberta dos raios X',
    summary: 'Wilhelm Röntgen inaugura a imagem médica moderna.',
    details: 'A visualização não invasiva do corpo revolucionou trauma, pneumologia, ortopedia e praticamente todas as especialidades clínicas.',
    impact: 'Criou a base da radiologia diagnóstica e abriu caminho para TC, mamografia e fluoroscopia.',
  },
  {
    year: '1928',
    title: 'Penicilina',
    summary: 'Alexander Fleming observa o efeito antibacteriano do fungo Penicillium.',
    details: 'A penicilina transformou o tratamento de infecções bacterianas e alterou o prognóstico de doenças antes frequentemente fatais.',
    impact: 'Mudou mortalidade global e redefiniu infectologia, cirurgia e terapia intensiva.',
  },
  {
    year: '1953',
    title: 'Estrutura do DNA',
    summary: 'A elucidação da dupla hélice muda a medicina para sempre.',
    details: 'A compreensão da genética molecular abriu portas para diagnóstico de doenças hereditárias, oncologia de precisão e terapias-alvo.',
    impact: 'É uma das bases da medicina personalizada contemporânea.',
  },
  {
    year: '1971',
    title: 'Primeira tomografia computadorizada',
    summary: 'A TC amplia a precisão anatômica e a velocidade diagnóstica.',
    details: 'O método impactou fortemente neurologia, trauma e emergência, permitindo melhor detecção de hemorragias, tumores e lesões internas.',
    impact: 'Foi decisiva para protocolos modernos de AVC e trauma.',
  },
  {
    year: '2003',
    title: 'Projeto Genoma Humano',
    summary: 'A medicina entra de vez na era dos dados biológicos em larga escala.',
    details: 'O sequenciamento genômico ampliou pesquisa translacional, farmacogenômica e oncologia de precisão.',
    impact: 'Preparou o terreno para IA médica orientada por grandes bases de dados.',
  },
  {
    year: '2023+',
    title: 'IA generativa na saúde',
    summary: 'Modelos de linguagem passam a apoiar ensino, triagem e documentação clínica.',
    details: 'Quando usados com governança e validação, ajudam em educação médica, sumarização, criação de questões e suporte de raciocínio.',
    impact: 'Expandem produtividade e personalização do estudo, mas exigem forte camada de segurança e revisão humana.',
  },
];

export function getTopicById(topicId: string) {
  return STUDY_TOPICS.find((topic) => topic.id === topicId) ?? STUDY_TOPICS[0];
}

export function buildLocalStudyResponse(input: string, topicId: string) {
  const topic = getTopicById(topicId);
  const normalizedInput = input.toLowerCase();

  if (normalizedInput.includes('plano') || normalizedInput.includes('cronograma')) {
    return `Plano rápido para ${topic.title}:\n1. Revise os quick facts.\n2. Faça os flashcards em voz alta.\n3. Resolva o quiz e explique cada alternativa errada.\n4. Feche com um caso clínico curto do tema.`;
  }

  if (normalizedInput.includes('compare') || normalizedInput.includes('diferen')) {
    return `Comparação guiada em ${topic.title}: foque em sinais de alarme, exames que mudam conduta e diagnósticos diferenciais de maior risco. Use os flashcards para memorizar e o quiz para testar discriminação.`;
  }

  if (normalizedInput.includes('caso')) {
    return `Mini-caso de ${topic.title}: paciente com quadro compatível com ${topic.quickFacts[0].toLowerCase()}. Descreva hipótese principal, red flags, exames iniciais e próxima decisão clínica.`;
  }

  return `Resumo de ${topic.title}: ${topic.description} Objetivo principal: ${topic.objective} Pontos de memorização: ${topic.quickFacts.join(' | ')}.`;
}

function shuffleArray<T>(items: T[]) {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function buildLessonPool() {
  return STUDY_TOPICS.flatMap((topic) => {
    const quickFactLessons = topic.quickFacts.map((fact, index) => ({
      topicId: topic.id,
      title: `${topic.title} • Aula rápida ${index + 1}`,
      content: `${fact} Objetivo da aula: ${topic.objective}`,
    }));

    const flashcardLessons = topic.flashcards.map((card, index) => ({
      topicId: topic.id,
      title: `${topic.title} • Revisão clínica ${index + 1}`,
      content: `Pergunta-chave: ${card.question}\nConceito central: ${card.answer}\nDica de fixação: ${card.hint}`,
    }));

    return [...quickFactLessons, ...flashcardLessons];
  });
}

function buildQuizPool() {
  return STUDY_TOPICS.flatMap((topic) =>
    topic.quiz.map((question) => ({
      ...question,
      options: shuffleArray(question.options),
    })),
  );
}

export function generateRandomStudyPack(topicId: string): GeneratedStudyPack {
  const topic = getTopicById(topicId);
  const lessons = shuffleArray(
    buildLessonPool().map((lesson) => ({
      ...lesson,
      content: `${lesson.content}\nAplicação prática em ${topic.title}: conecte com red flags e exames iniciais.`,
    })),
  ).slice(0, 10);

  const quiz = shuffleArray(buildQuizPool()).slice(0, 10);
  const flashcards = shuffleArray(
    STUDY_TOPICS.flatMap((item) =>
      item.flashcards.map((card) => ({
        question: `[${item.title}] ${card.question}`,
        answer: card.answer,
        hint: card.hint,
      })),
    ),
  ).slice(0, 10);

  return {
    topicId: topic.id,
    generatedAt: new Date().toISOString(),
    lessons,
    quiz,
    flashcards,
  };
}
