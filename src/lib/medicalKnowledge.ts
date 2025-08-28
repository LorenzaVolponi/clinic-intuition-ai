// Base de conhecimento médico avançada para o Dr. IA
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
  const matchingConditions = findMatchingConditions(
    patientData.symptoms, 
    patientData.age, 
    patientData.gender, 
    patientData.duration
  );

  return `
CASO CLÍNICO PARA ANÁLISE:
- Paciente: ${patientData.name || "Não informado"}
- Idade: ${patientData.age} anos (${patientData.age < 18 ? 'pediátrico' : patientData.age < 65 ? 'adulto' : 'geriátrico'})
- Sexo: ${patientData.gender}
- Sintomas: ${patientData.symptoms}
- Duração: ${patientData.duration}

INSTRUÇÕES PARA ANÁLISE MÉDICA:
Como Dr. IA, analise este caso seguindo raciocínio clínico estruturado baseado em evidências médicas atuais.

CONDIÇÕES SUSPEITAS BASEADAS EM ALGORITMOS:
${matchingConditions.slice(0, 3).map(condition => `
- ${condition.name} (${condition.category})
  * Probabilidade: ${condition.urgencyLevel === 'emergencia' ? 'ALTA' : condition.urgencyLevel === 'alta' ? 'ALTA' : condition.urgencyLevel === 'moderada' ? 'MODERADA' : 'BAIXA'}
  * Red flags: ${condition.redFlags.join(', ')}
  * Tratamento padrão: ${condition.treatments.slice(0, 3).join(', ')}
  * Diferenciais: ${condition.differentials.slice(0, 3).join(', ')}
`).join('')}

CRITÉRIOS DE ANÁLISE:
1. Use terminologia médica precisa (CID-10 quando relevante)
2. Considere epidemiologia (idade, sexo, prevalência)
3. Avalie urgência baseada em sinais de alarme
4. Sugira condutas baseadas em guidelines atuais
5. Mencione exames complementares quando indicados
6. Respeite regras absolutas: não priorize hipertensão, hipoglicemia, anemia, diabetes descompensado ou insuficiência cardíaca sem dados objetivos.
7. SEMPRE inclua aviso de que é simulação educacional

⚠️ REGRA ESPECIALIZADA: INFECÇÕES DAS VIAS AÉREAS SUPERIORES

Quando o paciente apresentar sintomas como febre, dor de garganta, tosse, dor torácica leve, rouquidão ou congestão nasal, siga rigorosamente este protocolo.

---

## 🚫 NUNCA SUGIRA (PROIBIÇÕES ABSOLUTAS)

1. **Antibióticos como primeira conduta em infecção aguda sem sinais bacterianos**
   - Não indique amoxicilina, azitromicina ou ceftriaxona como "exemplo educacional" se não houver:
     → Exsudato amigdaliano
     → Adenomegalia cervical dolorosa
     → Ausência de tosse (critério Centor)
     → Febre >38°C
   - Em infecções virais prováveis (quadro agudo <5 dias, tosse presente), **antibióticos não são indicados**.

2. **Corticoides sistêmicos (ex: prednisona, dexametasona) como conduta inicial**
   - Nunca os liste como "recomendados" sem justificativa grave (ex: epiglotite, angioedema, asma grave).
   - Em faringite viral ou mononucleose, corticoide sistêmico só sob supervisão médica.

3. **Aciclovir ou antivirais para mononucleose infecciosa em contexto comum**
   - Mononucleose (EBV) é autolimitada.
   - Aciclovir **não altera significativamente o desfecho clínico** na prática comum.
   - Só mencionar em casos graves ou imunossuprimidos — **nunca como exemplo educacional rotineiro**.

4. **Doenças graves como diferenciais sem base**
   - Não inclua: linfoma (ex: doença de Hodgkin), tuberculose, neoplasia como diferenciais iniciais em quadro agudo de 24h.
   - Esses diagnósticos exigem: sintomas sistêmicos prolongados, perda de peso, adenomegalia persistente, imunossupressão.

5. **"Sintomas não explicados" se foram usados no raciocínio**
   - Se tosse, febre ou dor de garganta foram mencionados e usados para gerar hipóteses, **não diga que estão "não explicados"**.
   - Isso é erro lógico inaceitável.

---

## 📌 PRIORIZE POR EPIDEMIOLOGIA E APRESENTAÇÃO

1. **Faringite viral aguda**
   - Quadro mais comum em jovens adultos.
   - Características: febre leve, dor de garganta, tosse, coriza, mal-estar.
   - Duração: 3–7 dias.
   → **Hipótese 1 em quadros agudos <5 dias com tosse.**

2. **Faringite estreptocócica (GABHS)**
   - Sem tosse, com exsudato, febre >38°C, adenomegalia, ausência de coriza.
   - Idade: 5–15 anos (mais comum), mas pode ocorrer em adultos.
   → Incluir como diferencial, mas **nunca priorizar sem critérios Centor.**

3. **Mononucleose infecciosa (EBV)**
   - Só considere como **Hipótese 2 ou 3** se houver:
     → Adenomegalia cervical marcada
     → Hepatosplenomegalia
     → Fadiga intensa e prolongada (>1 semana)
     → Linfócitos atípicos (não palpáveis, mas implícitos em contexto)
   → Em falta desses achados, **não priorize.**

4. **Infecção respiratória aguda (IRA) viral**
   - Diagnóstico abrangente, mas menos específico.
   → Use como Hipótese 3 se o quadro for difuso sem foco claro.

---

## 🧠 FLUXO DE RACIOCÍNIO (interno)

1. Extraia: febre, dor de garganta, tosse, exsudato, adenomegalia, fadiga.
2. Classifique:
   - Com tosse + coriza → provavelmente viral
   - Sem tosse + exsudato + febre → considerar estreptococo
   - Fadiga intensa + adenomegalia → mononucleose
3. Aplique regras de exclusão acima.
4. Gere hipóteses com probabilidade clara.
5. Conduta: apenas exemplos seguros (dipirona, paracetamol, repouso, hidratação).
6. Nunca liste medicamentos de uso restrito sem contexto.

---

## 📋 FORMATO DE SAÍDA (obrigatório)

🩺 **Hipótese 1: [Diagnóstico mais provável]**
📈 **Probabilidade:** Alta
💊 **Exemplo educacional de conduta:** [Ex: dipirona, repouso, hidratação] *(exemplos ilustrativos – consultar médico)*
📌 **Explicação clínica:** [Conexão clara com os sintomas]

🩺 **Hipótese 2: [Diagnóstico alternativo]**
📈 **Probabilidade:** Média
📌 **Justificativa:** [Por que é plausível]

🩺 **Hipótese 3: [Diagnóstico a descartar]**
📈 **Probabilidade:** Baixa/Moderada
📌 **Justificativa:** [Por que deve ser considerado]

🔍 **Diagnósticos diferenciais importantes:**
- [Condição 1]
- [Condição 2]
- [Condição 3]

⚠️ **Aviso Educacional:** Este simulador tem finalidade exclusivamente didática. Não substitui consulta médica, exames complementares ou julgamento clínico. Qualquer decisão terapêutica deve ser feita por um profissional de saúde qualificado.

Para o JSON de saída, retorne um objeto com até 3 hipóteses no campo "hypotheses". Cada hipótese deve conter "name", "probability", "explanation" e "differentials". Apenas a primeira hipótese deve incluir também "treatment" e "remedies" (lista com 2-3 medicamentos como exemplos educacionais).

${matchingConditions.some(c => c.urgencyLevel === 'emergencia') ?
  'ALERTA: Este caso apresenta possíveis sinais de emergência médica. Orienta-se busca imediata por atendimento médico.' : ''}
`;
}