export interface MedicalCondition {
  name: string;
  icd10?: string;
  category: string;
  commonSymptoms: string[];
  riskFactors: string[];
  ageGroups: string[];
  genderPreference?: 'masculino' | 'feminino' | 'both';
  urgencyLevel: 'baixa' | 'moderada' | 'alta' | 'emergencia';
  treatments: string[];
  differentials: string[];
  redFlags: string[];
  clinicalPearls: string[];
  recommendedExams: string[];
  durationProfile?: Array<'hiperagudo' | 'agudo' | 'subagudo' | 'cronico'>;
}

export interface PatientData {
  name: string;
  age: number;
  gender: string;
  symptoms: string;
  duration: string;
}

export interface DiagnosisHypothesis {
  name: string;
  probability: 'Alta' | 'Moderada' | 'Baixa';
  treatment: string;
  explanation: string;
  differentials: string[];
  recommendedExams: string[];
  redFlags: string[];
  score: number;
}

export interface ClinicalAssessment {
  hypotheses: DiagnosisHypothesis[];
  emergencyWarning?: string;
  triageLevel: 'Emergência' | 'Urgente' | 'Prioritário' | 'Ambulatorial';
  triageReason: string;
  suggestedExams: string[];
  immediateActions: string[];
  clinicalSummary: string;
  analysisSource: 'local' | 'groq';
}

const DURATION_MAP: Record<string, 'hiperagudo' | 'agudo' | 'subagudo' | 'cronico'> = {
  '< 6h': 'hiperagudo',
  '6-24h': 'agudo',
  '1-7d': 'agudo',
  '1-4sem': 'subagudo',
  '> 4sem': 'cronico',
};

const SYMPTOM_SYNONYMS: Record<string, string[]> = {
  'dor torácica': ['dor no peito', 'aperto no peito', 'pressão no peito'],
  dispneia: ['falta de ar', 'cansaço para respirar', 'dificuldade respiratória'],
  cefaleia: ['dor de cabeça'],
  vertigem: ['tontura rotatória'],
  paresia: ['fraqueza', 'fraqueza muscular'],
  hemiparesia: ['fraqueza de um lado', 'fraqueza em hemicorpo'],
  polaciúria: ['urinar muitas vezes', 'aumento da frequência urinária'],
  disúria: ['ardor para urinar', 'dor ao urinar'],
  hematoquezia: ['sangue vivo nas fezes'],
  melena: ['fezes enegrecidas'],
  náusea: ['enjoo'],
  vômito: ['vomito'],
  fadiga: ['cansaço', 'astenia'],
  febre: ['temperatura alta'],
};

const RED_FLAG_PATTERNS = [
  'dor no peito',
  'dor torácica',
  'falta de ar',
  'dispneia de repouso',
  'perda de consciência',
  'confusão mental',
  'hemiparesia',
  'convulsões',
  'hemoptise',
  'melena',
  'hematúria',
  'anúria',
  'rigidez nucal',
  'sudorese profusa',
];

export const MEDICAL_CONDITIONS: MedicalCondition[] = [
  {
    name: 'Síndrome Coronariana Aguda',
    icd10: 'I20-I25',
    category: 'cardiovascular',
    commonSymptoms: ['dor torácica', 'dor no peito', 'dispneia', 'sudorese', 'náusea'],
    riskFactors: ['idade > 40 anos', 'diabetes', 'hipertensão', 'tabagismo', 'dislipidemia'],
    ageGroups: ['adulto', 'idoso'],
    genderPreference: 'masculino',
    urgencyLevel: 'emergencia',
    treatments: ['AAS 200mg', 'Clopidogrel 300-600mg', 'Atorvastatina 80mg', 'Metoprolol'],
    differentials: ['Pericardite', 'Embolia pulmonar', 'Pneumotórax', 'Dissecção aórtica'],
    redFlags: ['dor em aperto/peso', 'irradiação para braço esquerdo', 'sudorese profusa'],
    clinicalPearls: ['ECG em até 10min', 'Troponinas seriadas', 'Score TIMI/GRACE'],
    recommendedExams: ['ECG', 'Troponina seriada', 'RX de tórax', 'Monitorização cardíaca'],
    durationProfile: ['hiperagudo', 'agudo'],
  },
  {
    name: 'Insuficiência Cardíaca Aguda',
    icd10: 'I50',
    category: 'cardiovascular',
    commonSymptoms: ['dispneia', 'edema', 'ortopneia', 'dispneia paroxística noturna'],
    riskFactors: ['hipertensão', 'diabetes', 'cardiopatia isquêmica', 'idade > 65'],
    ageGroups: ['adulto', 'idoso'],
    urgencyLevel: 'alta',
    treatments: ['Furosemida 40-80mg', 'Captopril 6,25-25mg', 'Carvedilol 3,125mg'],
    differentials: ['Pneumonia', 'DPOC', 'Embolia pulmonar'],
    redFlags: ['sat O2 < 90%', 'crepitantes bibasais', 'B3 audível'],
    clinicalPearls: ['BNP/NT-proBNP', 'Ecocardiograma', 'Classificação NYHA'],
    recommendedExams: ['BNP/NT-proBNP', 'Ecocardiograma', 'RX de tórax', 'Função renal'],
    durationProfile: ['agudo', 'subagudo'],
  },
  {
    name: 'Pneumonia Adquirida na Comunidade',
    icd10: 'J18',
    category: 'respiratorio',
    commonSymptoms: ['febre', 'tosse produtiva', 'dispneia', 'dor pleurítica'],
    riskFactors: ['idade > 65', 'DPOC', 'diabetes', 'etilismo', 'tabagismo'],
    ageGroups: ['adulto', 'idoso'],
    urgencyLevel: 'moderada',
    treatments: ['Amoxicilina 875mg 8/8h', 'Azitromicina 500mg/dia', 'Levofloxacino 750mg'],
    differentials: ['Bronquite aguda', 'COVID-19', 'Tuberculose'],
    redFlags: ['sat O2 < 90%', 'confusão mental', 'hipotensão'],
    clinicalPearls: ['Score CURB-65', 'RX tórax', 'Procalcitonina se disponível'],
    recommendedExams: ['RX de tórax', 'Hemograma', 'Oximetria', 'Score CURB-65'],
    durationProfile: ['agudo', 'subagudo'],
  },
  {
    name: 'Asma Agudizada',
    icd10: 'J45',
    category: 'respiratorio',
    commonSymptoms: ['dispneia', 'sibilos', 'tosse seca', 'opressão torácica'],
    riskFactors: ['história pessoal/familiar', 'alergens', 'infecções respiratórias'],
    ageGroups: ['crianca', 'adolescente', 'adulto'],
    urgencyLevel: 'moderada',
    treatments: ['Salbutamol spray', 'Budesonida inalatória', 'Prednisolona 40mg'],
    differentials: ['DPOC', 'Pneumonia', 'Pneumotórax'],
    redFlags: ['uso de musculatura acessória', 'cianose', 'silêncio auscultatório'],
    clinicalPearls: ['Peak flow', 'Saturação O2', 'Resposta ao broncodilatador'],
    recommendedExams: ['Oximetria', 'Peak flow', 'Avaliação clínica seriada'],
    durationProfile: ['hiperagudo', 'agudo'],
  },
  {
    name: 'Apendicite Aguda',
    icd10: 'K35',
    category: 'gastrointestinal',
    commonSymptoms: ['dor abdominal', 'náusea', 'vômito', 'febre'],
    riskFactors: ['idade 10-30 anos', 'sexo masculino'],
    ageGroups: ['crianca', 'adolescente', 'adulto'],
    urgencyLevel: 'alta',
    treatments: ['Ceftriaxona 2g', 'Metronidazol 500mg', 'Dipirona 500mg'],
    differentials: ['Gastroenterite', 'DIP', 'Litíase urinária', 'Gravidez ectópica'],
    redFlags: ['sinal de Blumberg', 'migração da dor', 'leucocitose com desvio'],
    clinicalPearls: ['Score de Alvarado', 'TC abdome se dúvida', 'Cirurgia urgente'],
    recommendedExams: ['Hemograma', 'PCR', 'USG/TC de abdome', 'Score de Alvarado'],
    durationProfile: ['agudo'],
  },
  {
    name: 'Gastroenterite Aguda',
    icd10: 'K59.1',
    category: 'gastrointestinal',
    commonSymptoms: ['diarreia', 'vômito', 'dor abdominal', 'febre'],
    riskFactors: ['alimentos contaminados', 'viagens', 'contato com doentes'],
    ageGroups: ['crianca', 'adulto'],
    urgencyLevel: 'baixa',
    treatments: ['Soro de reidratação oral', 'Probióticos', 'Sintomáticos'],
    differentials: ['Apendicite', 'DII', 'Intoxicação alimentar'],
    redFlags: ['desidratação severa', 'sangue nas fezes', 'febre alta'],
    clinicalPearls: ['Hidratação é fundamental', 'Evitar antidiarreicos se febre'],
    recommendedExams: ['Avaliação de hidratação', 'Eletrólitos se grave', 'Coprocultura se indicado'],
    durationProfile: ['agudo'],
  },
  {
    name: 'Cefaleia Tensional',
    icd10: 'G44.2',
    category: 'neurologico',
    commonSymptoms: ['cefaleia', 'dor de cabeça', 'tensão cervical'],
    riskFactors: ['estresse', 'ansiedade', 'má postura', 'sono inadequado'],
    ageGroups: ['adolescente', 'adulto'],
    urgencyLevel: 'baixa',
    treatments: ['Dipirona 500mg', 'Paracetamol 750mg', 'Relaxantes musculares'],
    differentials: ['Enxaqueca', 'Cefaleia em salvas', 'Hipertensão intracraniana'],
    redFlags: ['início súbito', 'febre + rigidez nucal', 'alterações neurológicas'],
    clinicalPearls: ['História é fundamental', 'Sinais de alarme', 'Diário da cefaleia'],
    recommendedExams: ['Exame neurológico', 'Neuroimagem se sinais de alarme'],
    durationProfile: ['subagudo', 'cronico'],
  },
  {
    name: 'Acidente Vascular Cerebral',
    icd10: 'I64',
    category: 'neurologico',
    commonSymptoms: ['hemiparesia', 'afasia', 'alteração consciência', 'cefaleia súbita'],
    riskFactors: ['hipertensão', 'diabetes', 'FA', 'idade > 55', 'tabagismo'],
    ageGroups: ['adulto', 'idoso'],
    urgencyLevel: 'emergencia',
    treatments: ['AAS 300mg', 'Atorvastatina 80mg', 'Trombólise se indicada'],
    differentials: ['Hipoglicemia', 'Enxaqueca com aura', 'Convulsão'],
    redFlags: ['déficit focal súbito', 'NIHSS > 4', '< 4,5h de início'],
    clinicalPearls: ['Janela terapêutica', 'TC crânio urgente', 'Scale NIHSS/ABCD2'],
    recommendedExams: ['TC de crânio', 'Glicemia capilar', 'NIHSS', 'ECG'],
    durationProfile: ['hiperagudo', 'agudo'],
  },
  {
    name: 'Infecção do Trato Urinário',
    icd10: 'N39.0',
    category: 'genitourinario',
    commonSymptoms: ['disúria', 'polaciúria', 'urgência miccional', 'dor suprapúbica'],
    riskFactors: ['sexo feminino', 'atividade sexual', 'diabetes', 'gravidez'],
    ageGroups: ['adulto'],
    genderPreference: 'feminino',
    urgencyLevel: 'baixa',
    treatments: ['Nitrofurantoína 100mg', 'Sulfametoxazol+Trimetoprim', 'Fosfomicina 3g'],
    differentials: ['Vaginite', 'Uretrite', 'Pielonefrite'],
    redFlags: ['febre + dor lombar', 'náuseas/vômitos', 'hematúria macroscópica'],
    clinicalPearls: ['EAS + urocultura', 'Tratamento empírico inicial', 'Seguimento clínico'],
    recommendedExams: ['EAS', 'Urocultura', 'Função renal se grave'],
    durationProfile: ['agudo', 'subagudo'],
  },
  {
    name: 'COVID-19',
    icd10: 'U07.1',
    category: 'infeccioso',
    commonSymptoms: ['febre', 'tosse seca', 'fadiga', 'anosmia', 'dispneia'],
    riskFactors: ['idade > 60', 'comorbidades', 'imunossupressão', 'obesidade'],
    ageGroups: ['adulto', 'idoso'],
    urgencyLevel: 'moderada',
    treatments: ['Sintomáticos', 'Corticóides se O2 < 94%', 'Anticoagulação'],
    differentials: ['Influenza', 'Pneumonia bacteriana', 'Outras viroses'],
    redFlags: ['sat O2 < 94%', 'dispneia progressiva', 'confusão mental'],
    clinicalPearls: ['RT-PCR', 'D-dímero elevado', 'Isolamento necessário'],
    recommendedExams: ['Teste antigênico/RT-PCR', 'Oximetria', 'RX/TC se grave'],
    durationProfile: ['agudo'],
  },
];

export const CLINICAL_SCALES = {
  CURB65: {
    name: 'CURB-65 (Pneumonia)',
    criteria: ['Confusão', 'Ureia > 7mmol/L', 'FR ≥ 30', 'PA sistólica < 90', 'Idade ≥ 65'],
    interpretation: {
      '0-1': 'Baixo risco - tratamento ambulatorial',
      '2': 'Risco moderado - considerar internação',
      '3-5': 'Alto risco - internação hospitalar',
    },
  },
  ALVARADO: {
    name: 'Score de Alvarado (Apendicite)',
    criteria: ['Dor em FID', 'Náusea/vômito', 'Anorexia', 'Dor migratória', 'Febre', 'Leucocitose', 'Desvio à esquerda'],
    interpretation: {
      '0-4': 'Baixa probabilidade',
      '5-6': 'Probabilidade moderada',
      '7-10': 'Alta probabilidade',
    },
  },
  NIHSS: {
    name: 'NIHSS (AVC)',
    criteria: ['Consciência', 'Comandos', 'Movimentos oculares', 'Campos visuais', 'Paresia facial'],
    interpretation: {
      '0-4': 'AVC leve',
      '5-15': 'AVC moderado',
      '16-20': 'AVC moderado-grave',
      '21-42': 'AVC grave',
    },
  },
};

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function probabilityFromScore(score: number): 'Alta' | 'Moderada' | 'Baixa' {
  if (score >= 70) return 'Alta';
  if (score >= 45) return 'Moderada';
  return 'Baixa';
}

function urgencyToTriage(level: MedicalCondition['urgencyLevel']): ClinicalAssessment['triageLevel'] {
  switch (level) {
    case 'emergencia':
      return 'Emergência';
    case 'alta':
      return 'Urgente';
    case 'moderada':
      return 'Prioritário';
    default:
      return 'Ambulatorial';
  }
}

function getAgeGroup(age: number) {
  if (age < 13) return 'crianca';
  if (age < 18) return 'adolescente';
  if (age < 65) return 'adulto';
  return 'idoso';
}

function getDurationProfile(duration: string) {
  return DURATION_MAP[duration] ?? 'agudo';
}

function matchesTerm(text: string, term: string) {
  const normalizedText = normalizeText(text);
  const normalizedTerm = normalizeText(term);
  const variants = [normalizedTerm, ...(SYMPTOM_SYNONYMS[term] ?? []).map(normalizeText)];
  return variants.some((variant) => normalizedText.includes(variant));
}

function scoreCondition(condition: MedicalCondition, patientData: PatientData) {
  const ageGroup = getAgeGroup(patientData.age);
  const durationProfile = getDurationProfile(patientData.duration);
  const symptomHits = condition.commonSymptoms.filter((symptom) => matchesTerm(patientData.symptoms, symptom)).length;
  const redFlagHits = condition.redFlags.filter((flag) => matchesTerm(patientData.symptoms, flag)).length;

  let score = symptomHits * 22 + redFlagHits * 10;

  if (condition.ageGroups.includes(ageGroup)) score += 10;
  if (!condition.durationProfile || condition.durationProfile.includes(durationProfile)) score += 8;
  if (!condition.genderPreference || condition.genderPreference === patientData.gender || condition.genderPreference === 'both') {
    score += 6;
  }

  if (condition.urgencyLevel === 'emergencia' && redFlagHits > 0) score += 12;
  if (condition.urgencyLevel === 'alta' && symptomHits > 1) score += 6;

  return Math.min(score, 100);
}

export function findMatchingConditions(patientData: PatientData) {
  return MEDICAL_CONDITIONS.map((condition) => ({
    condition,
    score: scoreCondition(condition, patientData),
  }))
    .filter(({ score }) => score >= 20)
    .sort((a, b) => b.score - a.score);
}

export function buildLocalAssessment(patientData: PatientData): ClinicalAssessment {
  const rankedConditions = findMatchingConditions(patientData);
  const normalizedSymptoms = normalizeText(patientData.symptoms);
  const genericRedFlags = RED_FLAG_PATTERNS.filter((flag) => normalizedSymptoms.includes(normalizeText(flag)));

  if (rankedConditions.length === 0) {
    return {
      hypotheses: [
        {
          name: 'Quadro Clínico Inespecífico',
          probability: 'Baixa',
          treatment: 'Observação clínica, reavaliação em 24-48h, medidas sintomáticas e coleta de dados adicionais.',
          explanation: 'Os dados informados são insuficientes para um encaixe consistente na base de conhecimento. O caso precisa de anamnese dirigida, exame físico e sinais vitais.',
          differentials: ['Síndrome viral inespecífica', 'Distúrbio funcional', 'Doença em fase inicial', 'Condição não contemplada na base'],
          recommendedExams: ['Sinais vitais completos', 'Exame físico direcionado', 'Exames laboratoriais básicos conforme contexto'],
          redFlags: genericRedFlags,
          score: 18,
        },
      ],
      triageLevel: genericRedFlags.length > 0 ? 'Urgente' : 'Ambulatorial',
      triageReason: genericRedFlags.length > 0
        ? 'Foram identificados sinais de alarme no relato livre, apesar de não haver correspondência forte com a base.'
        : 'Sem correspondência forte e sem sinais críticos claros no texto informado.',
      emergencyWarning: genericRedFlags.length > 0
        ? '🚨 Foram citados sintomas potencialmente graves. Recomenda-se avaliação presencial rápida para descartar emergência.'
        : undefined,
      suggestedExams: ['Sinais vitais completos', 'Exame físico dirigido', 'Reavaliação clínica'],
      immediateActions: genericRedFlags.length > 0
        ? ['Priorizar avaliação presencial', 'Registrar sinais vitais imediatamente', 'Escalonar se houver piora clínica']
        : ['Complementar história clínica', 'Registrar comorbidades e medicações', 'Definir hipótese após exame físico'],
      clinicalSummary: `Paciente ${patientData.age} anos com sintomas descritos como ${patientData.symptoms}. Caso sem correspondência robusta na base local.`,
      analysisSource: 'local',
    };
  }

  const topMatches = rankedConditions.slice(0, 3);
  const topUrgency = topMatches.reduce<MedicalCondition['urgencyLevel']>((current, { condition }) => {
    const order = { emergencia: 4, alta: 3, moderada: 2, baixa: 1 };
    return order[condition.urgencyLevel] > order[current] ? condition.urgencyLevel : current;
  }, 'baixa');

  const hypotheses = topMatches.map(({ condition, score }) => ({
    name: condition.name,
    probability: probabilityFromScore(score),
    treatment: `${condition.treatments.slice(0, 3).join(', ')} (exemplos educacionais; validar com protocolo institucional).`,
    explanation: `${condition.clinicalPearls[0] ?? 'Raciocínio clínico guiado pelos sintomas predominantes.'} Compatibilidade baseada em ${condition.commonSymptoms.slice(0, 3).join(', ')} e contexto clínico informado.`,
    differentials: condition.differentials.slice(0, 4),
    recommendedExams: condition.recommendedExams.slice(0, 4),
    redFlags: condition.redFlags.slice(0, 3),
    score,
  }));

  const emergencyWarning = topMatches.some(({ condition }) => condition.urgencyLevel === 'emergencia') || genericRedFlags.length >= 2
    ? '🚨 Atenção: o quadro contém sinais compatíveis com possível emergência médica. Recomenda-se avaliação presencial IMEDIATA. Em situação real, procure pronto-socorro ou acione o SAMU (192).'
    : undefined;

  const suggestedExams = [...new Set(topMatches.flatMap(({ condition }) => condition.recommendedExams))].slice(0, 6);
  const immediateActions = [
    topUrgency === 'emergencia' ? 'Encaminhar para avaliação imediata e monitorização.' : 'Conferir sinais vitais e gravidade atual.',
    'Revisar fatores de risco, medicações em uso e comorbidades.',
    'Correlacionar anamnese com exame físico antes de definir conduta real.',
  ];

  return {
    hypotheses,
    emergencyWarning,
    triageLevel: urgencyToTriage(topUrgency),
    triageReason: topMatches.length > 0
      ? `Prioridade definida pela hipótese principal (${topMatches[0].condition.name}) e pelos sinais de alarme associados.`
      : 'Prioridade baseada em sintomas relatados.',
    suggestedExams,
    immediateActions,
    clinicalSummary: `Paciente ${patientData.age} anos, ${patientData.gender}, com ${patientData.duration} de sintomas. Principais hipóteses locais: ${hypotheses.map((item) => item.name).join(', ')}.`,
    analysisSource: 'local',
  };
}

export function generateClinicalPrompt(patientData: PatientData, localAssessment: ClinicalAssessment): string {
  return `
Você é um assistente clínico educacional. Analise o caso em português do Brasil e devolva SOMENTE JSON válido.

CASO:
- Paciente: ${patientData.name || 'Não informado'}
- Idade: ${patientData.age} anos
- Gênero: ${patientData.gender}
- Duração: ${patientData.duration}
- Sintomas: ${patientData.symptoms}

RESUMO LOCAL:
- Triagem: ${localAssessment.triageLevel}
- Razão: ${localAssessment.triageReason}
- Hipóteses iniciais: ${localAssessment.hypotheses.map((h) => `${h.name} (${h.probability})`).join(', ')}
- Exames sugeridos: ${localAssessment.suggestedExams.join(', ')}

RESPONDA COM ESTE JSON:
{
  "clinicalSummary": "string",
  "triageLevel": "Emergência|Urgente|Prioritário|Ambulatorial",
  "triageReason": "string",
  "emergencyWarning": "string opcional",
  "hypotheses": [
    {
      "name": "string",
      "probability": "Alta|Moderada|Baixa",
      "treatment": "string",
      "explanation": "string",
      "differentials": ["string"],
      "recommendedExams": ["string"],
      "redFlags": ["string"]
    }
  ],
  "suggestedExams": ["string"],
  "immediateActions": ["string"]
}

REGRAS:
- Máximo 3 hipóteses.
- Ferramenta exclusivamente educacional; não prescrever conduta definitiva.
- Se houver sinais graves, inclua emergencyWarning.
- Use linguagem clínica objetiva, útil para estudantes.
`;
}
