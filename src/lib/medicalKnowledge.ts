// Base de conhecimento médico avançada para o Dr. IA
import { generateMainPrompt } from "./mainPrompt";

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
}

export interface PatientInput {
  name: string;
  age: number;
  gender: string;
  symptoms: string;
  duration: string;
}

export const MEDICAL_CONDITIONS: MedicalCondition[] = [
  // CARDIOVASCULAR
  {
    name: "Síndrome Coronariana Aguda",
    icd10: "I20-I25",
    category: "cardiovascular",
    commonSymptoms: ["dor torácica", "dor no peito", "dispneia", "sudorese", "náusea"],
    riskFactors: ["idade > 40 anos", "diabetes", "hipertensão", "tabagismo", "dislipidemia"],
    ageGroups: ["adulto", "idoso"],
    genderPreference: "masculino",
    urgencyLevel: "emergencia",
    treatments: ["AAS 200mg", "Clopidogrel 300-600mg", "Atorvastatina 80mg", "Metoprolol"],
    differentials: ["Pericardite", "Embolia pulmonar", "Pneumotórax", "Dissecção aórtica"],
    redFlags: ["dor em aperto/peso", "irradiação para braço esquerdo", "sudorese profusa"],
    clinicalPearls: ["ECG em até 10min", "Troponinas seriadas", "Score TIMI/GRACE"]
  },
  {
    name: "Insuficiência Cardíaca Aguda",
    icd10: "I50",
    category: "cardiovascular", 
    commonSymptoms: ["dispneia", "edema", "ortopneia", "dispneia paroxística noturna"],
    riskFactors: ["hipertensão", "diabetes", "cardiopatia isquêmica", "idade > 65"],
    ageGroups: ["adulto", "idoso"],
    urgencyLevel: "alta",
    treatments: ["Furosemida 40-80mg", "Captopril 6,25-25mg", "Carvedilol 3,125mg"],
    differentials: ["Pneumonia", "DPOC", "Embolia pulmonar"],
    redFlags: ["sat O2 < 90%", "crepitantes bibasais", "B3 audível"],
    clinicalPearls: ["BNP/NT-proBNP", "Ecocardiograma", "Classificação NYHA"]
  },

  // RESPIRATÓRIO
  {
    name: "Pneumonia Adquirida na Comunidade",
    icd10: "J18",
    category: "respiratorio",
    commonSymptoms: ["febre", "tosse produtiva", "dispneia", "dor pleurítica"],
    riskFactors: ["idade > 65", "DPOC", "diabetes", "etilismo", "tabagismo"],
    ageGroups: ["adulto", "idoso"],
    urgencyLevel: "moderada",
    treatments: ["Amoxicilina 875mg 8/8h", "Azitromicina 500mg/dia", "Levofloxacino 750mg"],
    differentials: ["Bronquite aguda", "COVID-19", "Tuberculose"],
    redFlags: ["sat O2 < 90%", "confusão mental", "hipotensão"],
    clinicalPearls: ["Score CURB-65", "RX tórax", "Procalcitonina se disponível"]
  },
  {
    name: "Asma Agudizada",
    icd10: "J45",
    category: "respiratorio",
    commonSymptoms: ["dispneia", "sibilos", "tosse seca", "opressão torácica"],
    riskFactors: ["história pessoal/familiar", "alergens", "infecções respiratórias"],
    ageGroups: ["crianca", "adolescente", "adulto"],
    urgencyLevel: "moderada",
    treatments: ["Salbutamol spray", "Budesonida inalatória", "Prednisolona 40mg"],
    differentials: ["DPOC", "Pneumonia", "Pneumotórax"],
    redFlags: ["uso de musculatura acessória", "cianose", "silêncio auscultatório"],
    clinicalPearls: ["Peak flow", "Saturação O2", "Resposta ao broncodilatador"]
  },

  // GASTROINTESTINAL
  {
    name: "Apendicite Aguda",
    icd10: "K35",
    category: "gastrointestinal",
    commonSymptoms: ["dor abdominal", "náusea", "vômito", "febre"],
    riskFactors: ["idade 10-30 anos", "sexo masculino"],
    ageGroups: ["crianca", "adolescente", "adulto"],
    urgencyLevel: "alta",
    treatments: ["Ceftriaxona 2g", "Metronidazol 500mg", "Dipirona 500mg"],
    differentials: ["Gastroenterite", "DIP", "Litíase urinária", "Gravidez ectópica"],
    redFlags: ["sinal de Blumberg", "migração da dor", "leucocitose com desvio"],
    clinicalPearls: ["Score de Alvarado", "TC abdome se dúvida", "Cirurgia urgente"]
  },
  {
    name: "Gastroenterite Aguda",
    icd10: "K59.1",
    category: "gastrointestinal",
    commonSymptoms: ["diarreia", "vômito", "dor abdominal", "febre"],
    riskFactors: ["alimentos contaminados", "viagens", "contato com doentes"],
    ageGroups: ["crianca", "adulto"],
    urgencyLevel: "baixa",
    treatments: ["Soro de reidratação oral", "Probióticos", "Sintomáticos"],
    differentials: ["Apendicite", "DII", "Intoxicação alimentar"],
    redFlags: ["desidratação severa", "sangue nas fezes", "febre alta"],
    clinicalPearls: ["Hidratação é fundamental", "Evitar antidiarreicos se febre"]
  },

  // NEUROLÓGICO
  {
    name: "Cefaleia Tensional",
    icd10: "G44.2",
    category: "neurologico",
    commonSymptoms: ["cefaleia", "dor de cabeça", "tensão cervical"],
    riskFactors: ["estresse", "ansiedade", "má postura", "sono inadequado"],
    ageGroups: ["adolescente", "adulto"],
    urgencyLevel: "baixa",
    treatments: ["Dipirona 500mg", "Paracetamol 750mg", "Relaxantes musculares"],
    differentials: ["Enxaqueca", "Cefaleia em salvas", "Hipertensão intracraniana"],
    redFlags: ["início súbito", "febre + rigidez nucal", "alterações neurológicas"],
    clinicalPearls: ["História é fundamental", "Sinais de alarme", "Diário da cefaleia"]
  },
  {
    name: "Acidente Vascular Cerebral",
    icd10: "I64",
    category: "neurologico", 
    commonSymptoms: ["hemiparesia", "afasia", "alteração consciência", "cefaleia súbita"],
    riskFactors: ["hipertensão", "diabetes", "FA", "idade > 55", "tabagismo"],
    ageGroups: ["adulto", "idoso"],
    urgencyLevel: "emergencia",
    treatments: ["AAS 300mg", "Atorvastatina 80mg", "Trombólise se indicada"],
    differentials: ["Hipoglicemia", "Enxaqueca com aura", "Convulsão"],
    redFlags: ["déficit focal súbito", "NIHSS > 4", "< 4,5h de início"],
    clinicalPearls: ["Janela terapêutica", "TC crânio urgente", "Scale NIHSS/ABCD2"]
  },

  // FUNCIONAL/PSICOLÓGICO
  {
    name: "Ansiedade Aguda",
    icd10: "F41.0",
    category: "funcional",
    commonSymptoms: [
      "palpitações",
      "tremores",
      "boca seca",
      "dor de cabeça",
      "náusea",
    ],
    riskFactors: ["estresse", "transtorno de ansiedade prévio", "cafeína"],
    ageGroups: ["adolescente", "adulto"],
    urgencyLevel: "baixa",
    treatments: [
      "Respiração guiada",
      "Apoio psicológico",
      "Técnicas de relaxamento",
    ],
    differentials: ["Hipoglicemia", "Hipertireoidismo", "Uso de estimulantes"],
    redFlags: ["dispneia intensa", "dor torácica", "síncope"],
    clinicalPearls: [
      "Avaliar com escalas de ansiedade",
      "Descartar causas orgânicas",
      "Considerar terapia cognitivo-comportamental",
    ],
  },

  // GENITOURINÁRIO
  {
    name: "Infecção do Trato Urinário",
    icd10: "N39.0",
    category: "genitourinario",
    commonSymptoms: ["disúria", "polaciúria", "urgência miccional", "dor suprapúbica"],
    riskFactors: ["sexo feminino", "atividade sexual", "diabetes", "gravidez"],
    ageGroups: ["adulto"],
    genderPreference: "feminino",
    urgencyLevel: "baixa",
    treatments: ["Nitrofurantoína 100mg", "Sulfametoxazol+Trimetoprim", "Fosfomicina 3g"],
    differentials: ["Vaginite", "Uretrite", "Pielonefrite"],
    redFlags: ["febre + dor lombar", "náuseas/vômitos", "hematúria macroscópica"],
    clinicalPearls: ["EAS + urocultura", "Tratamento empírico inicial", "Seguimento clínico"]
  },

  // SISTÊMICO/INFECCIOSO
  {
    name: "COVID-19",
    icd10: "U07.1",
    category: "infeccioso",
    commonSymptoms: ["febre", "tosse seca", "fadiga", "anosmia", "dispneia"],
    riskFactors: ["idade > 60", "comorbidades", "imunossupressão", "obesidade"],
    ageGroups: ["adulto", "idoso"],
    urgencyLevel: "moderada",
    treatments: ["Sintomáticos", "Corticóides se O2 < 94%", "Anticoagulação"],
    differentials: ["Influenza", "Pneumonia bacteriana", "Outras viroses"],
    redFlags: ["sat O2 < 94%", "dispneia progressiva", "confusão mental"],
    clinicalPearls: ["RT-PCR", "D-dímero elevado", "Isolamento necessário"]
  },

  // INFECÇÕES DAS VIAS AÉREAS SUPERIORES
  {
    name: "Faringite Viral Aguda",
    icd10: "J02.9",
    category: "infeccioso",
    commonSymptoms: ["febre", "dor de garganta", "tosse", "coriza", "congestão nasal", "rouquidão"],
    riskFactors: ["contato com doentes", "época fria"],
    ageGroups: ["adolescente", "adulto"],
    urgencyLevel: "baixa",
    treatments: [
      "Dipirona (para dor e febre)",
      "Paracetamol (acetaminofeno)",
      "Repouso e hidratação"
    ],
    differentials: [
      "Faringite estreptocócica",
      "Mononucleose infecciosa",
      "Influenza"
    ],
    redFlags: [
      "dispneia grave",
      "dificuldade para deglutir",
      "sinais de abscesso peritonsilar"
    ],
    clinicalPearls: [
      "Quadros virais melhoram em 3–7 dias",
      "Antibióticos não indicados sem sinais bacterianos"
    ]
  },
  {
    name: "Faringite Estreptocócica",
    icd10: "J02.0",
    category: "infeccioso",
    commonSymptoms: ["febre", "dor de garganta", "exsudato", "adenomegalia"],
    riskFactors: ["contato com caso confirmado", "época fria"],
    ageGroups: ["crianca", "adolescente", "adulto"],
    urgencyLevel: "moderada",
    treatments: [
      "Amoxicilina (primeira escolha)",
      "Azitromicina (alérgicos a penicilina)",
      "Repouso e hidratação"
    ],
    differentials: [
      "Mononucleose infecciosa",
      "Faringite viral aguda",
      "Abscesso peritonsilar"
    ],
    redFlags: [
      "dificuldade para respirar",
      "impossibilidade de deglutir",
      "sinais de choque"
    ],
    clinicalPearls: [
      "Aplicar critérios de Centor",
      "Confirmar com teste rápido ou cultura"
    ]
  },
  {
    name: "Mononucleose Infecciosa",
    icd10: "B27.0",
    category: "infeccioso",
    commonSymptoms: ["febre", "dor de garganta", "adenomegalia", "fadiga"],
    riskFactors: ["adolescência", "contato com saliva"],
    ageGroups: ["adolescente", "adulto"],
    urgencyLevel: "baixa",
    treatments: [
      "Repouso",
      "Hidratação",
      "Dipirona (para dor e febre)"
    ],
    differentials: [
      "Faringite viral aguda",
      "Faringite estreptocócica",
      "Hepatite"
    ],
    redFlags: [
      "dor abdominal intensa",
      "amígdalas muito aumentadas",
      "icterícia"
    ],
    clinicalPearls: [
      "Linfócitos atípicos sugerem diagnóstico",
      "Esplenomegalia pode ocorrer"
    ]
  },
  {
    name: "Infecção Respiratória Aguda Viral",
    icd10: "J06.9",
    category: "infeccioso",
    commonSymptoms: ["febre", "tosse", "coriza"],
    riskFactors: ["contato com doentes", "ambientes fechados"],
    ageGroups: ["crianca", "adolescente", "adulto"],
    urgencyLevel: "baixa",
    treatments: [
      "Dipirona (dor e febre)",
      "Paracetamol (acetaminofeno)",
      "Repouso e hidratação"
    ],
    differentials: [
      "Influenza",
      "COVID-19",
      "Faringite viral aguda"
    ],
    redFlags: [
      "dispneia",
      "saturação < 94%",
      "sinais de pneumonia"
    ],
    clinicalPearls: [
      "Normalmente autolimitada",
      "Antibióticos não indicados na ausência de sinais bacterianos"
    ]
  }
];

export const CLINICAL_SCALES = {
  CURB65: {
    name: "CURB-65 (Pneumonia)",
    criteria: ["Confusão", "Ureia > 7mmol/L", "FR ≥ 30", "PA sistólica < 90", "Idade ≥ 65"],
    interpretation: {
      "0-1": "Baixo risco - tratamento ambulatorial",
      "2": "Risco moderado - considerar internação",
      "3-5": "Alto risco - internação hospitalar"
    }
  },
  ALVARADO: {
    name: "Score de Alvarado (Apendicite)",
    criteria: ["Dor em FID", "Náusea/vômito", "Anorexia", "Dor migratória", "Febre", "Leucocitose", "Desvio à esquerda"],
    interpretation: {
      "0-4": "Baixa probabilidade",
      "5-6": "Probabilidade moderada", 
      "7-10": "Alta probabilidade"
    }
  },
  NIHSS: {
    name: "NIHSS (AVC)",
    criteria: ["Consciência", "Comandos", "Movimentos oculares", "Campos visuais", "Paresia facial"],
    interpretation: {
      "0-4": "AVC leve",
      "5-15": "AVC moderado",
      "16-20": "AVC moderado-grave", 
      "21-42": "AVC grave"
    }
  }
};

export function findMatchingConditions(
  symptoms: string,
  age: number,
  gender: string,
  duration: string
): MedicalCondition[] {
  const symptomList = symptoms
    .toLowerCase()
    .split(/,|;| e /i)
    .map((s) => s.trim())
    .filter(Boolean);
  const ageGroup = age < 18 ? "crianca" : age < 65 ? "adulto" : "idoso";
  const requiredScore = symptomList.length > 1 ? 2 : 1;

  return MEDICAL_CONDITIONS.map((condition) => {
    // Score by number of symptom matches
    const matchScore = condition.commonSymptoms.reduce((score, symptom) => {
      return score + (symptomList.includes(symptom.toLowerCase()) ? 1 : 0);
    }, 0);

    const ageMatch = condition.ageGroups.includes(ageGroup);
    const genderMatch =
      !condition.genderPreference ||
      condition.genderPreference === gender ||
      condition.genderPreference === "both";

    return { condition, matchScore, ageMatch, genderMatch };
  })
    .filter(
      (item) =>
        item.matchScore >= requiredScore && item.ageMatch && item.genderMatch
    )
    .sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      const urgencyOrder = {
        emergencia: 0,
        alta: 1,
        moderada: 2,
        baixa: 3,
      } as const;
      return (
        urgencyOrder[a.condition.urgencyLevel] -
        urgencyOrder[b.condition.urgencyLevel]
      );
    })
    .map((item) => item.condition);
}

export function generateClinicalPrompt(patientData: PatientInput): string {
  return generateMainPrompt(patientData);
}
