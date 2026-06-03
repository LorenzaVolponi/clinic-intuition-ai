import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';

export type EvidenceSourceKind = 'guideline' | 'public-health' | 'reference' | 'repository' | 'internal-kb';

export interface EvidenceSource {
  id: string;
  name: string;
  url: string;
  kind: EvidenceSourceKind;
  topics: string[];
  language: 'pt-BR' | 'en';
  refreshHours: number;
}

export interface EvidenceRecord {
  id: string;
  title: string;
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  topics: string[];
  summary: string;
  content: string;
  retrievedAt: string;
  updatedAt?: string;
  confidence: 'seed' | 'internal-generated' | 'remote-refreshed';
}

export interface EvidenceSearchResult extends EvidenceRecord {
  score: number;
  matchedTerms: string[];
}

export interface EvidenceSearchParams {
  query?: string;
  topic?: string;
  domain?: string;
  context?: string;
  dimension?: string;
  limit?: number;
}

export interface EvidenceBriefSection {
  title: string;
  items: string[];
}

export interface EvidenceCaseContextParams {
  symptoms: string;
  age?: number;
  duration?: string;
  triageLevel?: string;
  hypotheses?: string[];
  limit?: number;
}

interface EvidenceSearchDocument {
  record: EvidenceRecord;
  haystack: string;
  titleText: string;
}

const EVIDENCE_STORE_FILE = process.env.EVIDENCE_STORE_FILE || '/tmp/clinic-intuition-evidence-kb.json';
const MAX_REMOTE_TEXT_CHARS = 18_000;
const MAX_RECORDS_PER_REFRESH = 12;

export const evidenceSources: EvidenceSource[] = [
  {
    id: 'internal-massive-kb',
    name: 'Base interna massiva educacional',
    url: 'internal://clinical-kb',
    kind: 'internal-kb',
    topics: ['base interna', 'educacional', 'triagem', 'diagnostico diferencial'],
    language: 'pt-BR',
    refreshHours: 0,
  },
  {
    id: 'who-emergency-care',
    name: 'WHO Emergency and critical care',
    url: 'https://www.who.int/health-topics/emergency-care',
    kind: 'public-health',
    topics: ['emergencias', 'triagem', 'seguranca'],
    language: 'en',
    refreshHours: 168,
  },
  {
    id: 'cdc-pneumonia',
    name: 'CDC Pneumonia',
    url: 'https://www.cdc.gov/pneumonia/',
    kind: 'public-health',
    topics: ['respiratorio', 'infectologia', 'pneumonia'],
    language: 'en',
    refreshHours: 168,
  },
  {
    id: 'nice-chest-pain',
    name: 'NICE Chest pain guidance',
    url: 'https://www.nice.org.uk/guidance/cg95',
    kind: 'guideline',
    topics: ['cardiologia', 'dor toracica', 'emergencias'],
    language: 'en',
    refreshHours: 720,
  },
  {
    id: 'aha-cpr-ecc',
    name: 'American Heart Association CPR & ECC',
    url: 'https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines',
    kind: 'guideline',
    topics: ['cardiologia', 'emergencias', 'ressuscitacao'],
    language: 'en',
    refreshHours: 720,
  },
  {
    id: 'msd-manual-professional',
    name: 'MSD Manual Professional Edition',
    url: 'https://www.msdmanuals.com/professional',
    kind: 'reference',
    topics: ['clinica geral', 'diagnostico diferencial', 'referencia'],
    language: 'en',
    refreshHours: 720,
  },
  {
    id: 'open-guidelines-github',
    name: 'Open guideline repositories on GitHub',
    url: 'https://github.com/topics/clinical-guidelines',
    kind: 'repository',
    topics: ['github', 'guidelines', 'atualizacao'],
    language: 'en',
    refreshHours: 168,
  },
];

const MASSIVE_SEED_DOMAINS = [
  { id: 'cardiologia', label: 'Cardiologia', presentations: ['dor torácica', 'dispneia', 'síncope', 'palpitações', 'edema', 'choque', 'hipertensão', 'dor epigástrica', 'fadiga', 'sudorese'] },
  { id: 'respiratorio', label: 'Respiratório', presentations: ['dispneia', 'tosse', 'hemoptise', 'dor pleurítica', 'sibilância', 'hipoxemia', 'febre', 'taquipneia', 'cianose', 'expectoração'] },
  { id: 'neurologia', label: 'Neurologia', presentations: ['cefaleia', 'déficit focal', 'convulsão', 'confusão', 'síncope', 'vertigem', 'paresia', 'afasia', 'alteração visual', 'rigidez nucal'] },
  { id: 'gastrointestinal', label: 'Gastrointestinal', presentations: ['dor abdominal', 'vômitos', 'diarreia', 'melena', 'hematoquezia', 'icterícia', 'anorexia', 'distensão', 'dor epigástrica', 'constipação'] },
  { id: 'infectologia', label: 'Infectologia', presentations: ['febre', 'calafrios', 'sepse', 'rash', 'tosse febril', 'disúria febril', 'rigidez nucal', 'celulite', 'imunossupressão', 'prostração'] },
  { id: 'nefro-uro', label: 'Nefro-urologia', presentations: ['disúria', 'hematúria', 'oligúria', 'anúria', 'dor lombar', 'edema', 'retenção urinária', 'polaciúria', 'cólica renal', 'febre urinária'] },
  { id: 'endocrino', label: 'Endócrino-metabólico', presentations: ['hiperglicemia', 'hipoglicemia', 'perda de peso', 'poliúria', 'polidipsia', 'confusão', 'fraqueza', 'desidratação', 'cetoacidose', 'tremor'] },
  { id: 'hematologia', label: 'Hematologia', presentations: ['anemia', 'sangramento', 'púrpura', 'trombose', 'fadiga', 'febre prolongada', 'linfonodos', 'palidez', 'equimoses', 'dor óssea'] },
  { id: 'reumatologia', label: 'Reumatologia', presentations: ['artralgia', 'artrite', 'rash', 'febre', 'rigidez matinal', 'mialgia', 'úlcera oral', 'fenômeno de Raynaud', 'fadiga', 'edema articular'] },
  { id: 'dermatologia', label: 'Dermatologia', presentations: ['rash', 'urticária', 'celulite', 'lesão bolhosa', 'prurido', 'petéquias', 'úlcera', 'eritema', 'necrose', 'descamação'] },
  { id: 'gineco-obstetricia', label: 'Gineco-obstetrícia', presentations: ['dor pélvica', 'sangramento vaginal', 'atraso menstrual', 'corrimento', 'gestação', 'febre puerperal', 'hipertensão gestacional', 'vômitos', 'contrações', 'disúria'] },
  { id: 'pediatria', label: 'Pediatria', presentations: ['febre infantil', 'tosse', 'desidratação', 'convulsão febril', 'vômitos', 'diarreia', 'rash', 'letargia', 'sibilância', 'dor abdominal'] },
] as const;

const INTERNAL_CONTEXT_LAYERS = [
  { id: 'adulto', label: 'adulto', lens: 'contextualizar risco basal, comorbidades frequentes, medicações e sinais de deterioração' },
  { id: 'idoso', label: 'idoso/frágil', lens: 'valorizar apresentações atípicas, quedas, delirium, polifarmácia, fragilidade e reserva fisiológica reduzida' },
  { id: 'pediatrico', label: 'pediátrico', lens: 'adaptar linguagem, hidratação, comportamento, sinais de esforço e participação de responsáveis' },
  { id: 'gestacao', label: 'gestação/puerpério', lens: 'considerar segurança materno-fetal, hipertensão, sangramento, trombose, infecção e avaliação obstétrica' },
  { id: 'imunossupressao', label: 'imunossupressão', lens: 'baixar limiar para infecção grave, sintomas discretos, neutropenia, transplante e uso de imunobiológicos' },
  { id: 'cardiometabolico', label: 'risco cardiometabólico', lens: 'integrar diabetes, hipertensão, doença renal, obesidade, dislipidemia e risco vascular' },
  { id: 'emergencia', label: 'emergência', lens: 'priorizar ABCDE, sinais vitais, monitorização, reavaliação seriada e escalonamento presencial' },
  { id: 'aps', label: 'atenção primária', lens: 'organizar longitudinalidade, prevenção, acompanhamento, educação e critérios de encaminhamento' },
  { id: 'teletriagem', label: 'teletriagem', lens: 'explicitar limites remotos, perguntas de segurança, sinais de alarme e necessidade de avaliação presencial' },
  { id: 'reavaliacao', label: 'reavaliação', lens: 'comparar evolução, resposta, surgimento de red flags e mudança de hipótese/prioridade' },
  { id: 'recursos-limitados', label: 'recursos limitados', lens: 'focar exame clínico, estratificação de risco, segurança, transferência e exames essenciais' },
  { id: 'medicamentos', label: 'risco medicamentoso', lens: 'investigar anticoagulantes, corticoides, imunossupressores, hipoglicemiantes, alergias e interações' },
] as const;

const MASSIVE_SEED_DIMENSIONS = [
  { id: 'red-flags', title: 'red flags', focus: 'sinais de alarme, instabilidade, tempo de início e necessidade de avaliação presencial simulada' },
  { id: 'history', title: 'anamnese dirigida', focus: 'cronologia, intensidade, fatores de melhora/piora, antecedentes e negativos pertinentes' },
  { id: 'exam', title: 'exame físico orientado', focus: 'sinais vitais, estado geral, perfusão, oximetria e achados focais relevantes' },
  { id: 'differential', title: 'diagnóstico diferencial', focus: 'hipóteses prováveis, hipóteses graves a excluir e mimetizadores comuns' },
  { id: 'tests', title: 'exames iniciais', focus: 'exames de primeira linha, monitorização e interpretação contextual sem prescrição individual' },
  { id: 'triage', title: 'triagem educacional', focus: 'priorização por risco, urgência, sinais de deterioração e reavaliação seriada' },
  { id: 'safety', title: 'segurança e limites', focus: 'uso educacional, incerteza diagnóstica, validação profissional e diretrizes locais' },
  { id: 'follow-up', title: 'reavaliação', focus: 'mudança de sintomas, resposta às medidas simuladas, retorno e escalonamento de cuidado' },
] as const;

function buildMassiveSeedRecords(): EvidenceRecord[] {
  const records: EvidenceRecord[] = [];
  const retrievedAt = new Date(0).toISOString();

  for (const domain of MASSIVE_SEED_DOMAINS) {
    for (const presentation of domain.presentations) {
      for (const dimension of MASSIVE_SEED_DIMENSIONS) {
        for (const context of INTERNAL_CONTEXT_LAYERS) {
          const id = `internal-kb-${domain.id}-${normalizeText(presentation).replace(/\s+/g, '-')}-${dimension.id}-${context.id}`;
          const title = `${domain.label}: ${presentation} — ${dimension.title} (${context.label})`;
          const summary = `Base interna educacional para ${presentation} em ${domain.label}, com foco em ${dimension.focus}, aplicada ao contexto ${context.label}.`;

          records.push({
            id,
            title,
            sourceId: 'internal-massive-kb',
            sourceName: 'Base interna massiva educacional',
            sourceUrl: `internal://clinical-kb/${domain.id}/${dimension.id}/${context.id}`,
            topics: [domain.id, domain.label.toLowerCase(), presentation, dimension.id, context.id, context.label, 'base interna', 'educacional'],
            summary,
            content: [
              summary,
              `Checklist sugerido: identificar início, evolução, intensidade, fatores associados e negativos relevantes para ${presentation}.`,
              `Camada contextual: ${context.lens}.`,
              `Prioridade: reconhecer instabilidade, sinais vitais alterados, red flags e necessidade de avaliação presencial quando aplicável.`,
              `Diferenciais: organizar hipóteses prováveis e condições graves a excluir dentro de ${domain.label}, sem concluir diagnóstico definitivo.`,
              `Exames: pensar em investigação inicial contextual e protocolos institucionais, sempre com supervisão profissional.`,
              `Qualidade da anamnese: registrar impacto funcional, exposição, medicações, alergias, comorbidades, vulnerabilidades e dados negativos pertinentes.`,
              'Aviso: conteúdo para estudo, simulação e apoio educacional; não substitui avaliação médica, diretriz local ou decisão clínica real.',
            ].join(' '),
            retrievedAt,
            confidence: 'internal-generated',
          });
        }
      }
    }
  }

  return records;
}

const massiveSeedRecords = buildMassiveSeedRecords();

const seedRecords: EvidenceRecord[] = [
  {
    id: 'seed-chest-pain-red-flags',
    title: 'Dor torácica: prioridades educacionais',
    sourceId: 'local-seed',
    sourceName: 'Base educacional local',
    sourceUrl: 'local://clinical-seed/chest-pain',
    topics: ['cardiologia', 'dor toracica', 'emergencias'],
    summary: 'Dor torácica com sudorese, dispneia, síncope, instabilidade ou fatores de risco exige priorização de ECG, sinais vitais e exclusão de causas graves.',
    content:
      'Em simulação educacional, dor torácica deve ser organizada por tempo de início, padrão da dor, irradiação, esforço/repouso, sintomas associados e red flags. ECG precoce, monitorização e troponina seriada são itens de investigação frequentemente discutidos em protocolos institucionais. Não é recomendação individual.',
    retrievedAt: new Date(0).toISOString(),
    confidence: 'seed',
  },
  {
    id: 'seed-dyspnea-febrile',
    title: 'Dispneia febril: pontos de gravidade',
    sourceId: 'local-seed',
    sourceName: 'Base educacional local',
    sourceUrl: 'local://clinical-seed/dyspnea-fever',
    topics: ['respiratorio', 'infectologia', 'pneumonia', 'emergencias'],
    summary: 'Dispneia com febre deve destacar saturação, esforço respiratório, confusão, hipotensão, dor pleurítica e sinais de sepse.',
    content:
      'Para estudo, síndrome respiratória febril deve registrar início, tosse, expectoração, dor pleurítica, oximetria, comorbidades e critérios de gravidade. Hipoxemia, rebaixamento, instabilidade hemodinâmica e sepse simulada mudam prioridade de atendimento.',
    retrievedAt: new Date(0).toISOString(),
    confidence: 'seed',
  },
  {
    id: 'seed-abdominal-pain',
    title: 'Dor abdominal: cronologia e sinais cirúrgicos',
    sourceId: 'local-seed',
    sourceName: 'Base educacional local',
    sourceUrl: 'local://clinical-seed/abdominal-pain',
    topics: ['gastrointestinal', 'dor abdominal', 'cirurgia', 'emergencias'],
    summary: 'Dor migratória, sinais peritoneais, vômitos persistentes, febre, sangramento, gravidez e instabilidade são pistas de maior risco.',
    content:
      'Casos educacionais de dor abdominal se beneficiam de localização, migração, intensidade, fatores de piora, náuseas/vômitos, hábito intestinal, sintomas urinários/ginecológicos e red flags. A avaliação é sempre contextual e simulada.',
    retrievedAt: new Date(0).toISOString(),
    confidence: 'seed',
  },
];

const internalSeedRecords = [...seedRecords, ...massiveSeedRecords];
const internalTopicCounts = buildTopicCounts(internalSeedRecords);
let evidenceRecords = [...internalSeedRecords];
let evidenceSearchIndex: EvidenceSearchDocument[] = [];
let loadedFromDisk = false;
let lastRefreshAt: string | null = null;

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(' ')
    .filter((term) => term.length >= 3);
}

function buildEvidenceSearchIndex(records: EvidenceRecord[]): EvidenceSearchDocument[] {
  return records.map((record) => ({
    record,
    haystack: normalizeText([record.title, record.summary, record.content, record.topics.join(' ')].join(' ')),
    titleText: normalizeText(record.title),
  }));
}

function setEvidenceRecords(records: EvidenceRecord[]) {
  evidenceRecords = records;
  evidenceSearchIndex = buildEvidenceSearchIndex(records);
}

function recordHash(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 16);
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTitle(html: string, fallback: string) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  return stripHtml(title || fallback).slice(0, 140) || fallback;
}

function summarize(text: string) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  return sentences.slice(0, 3).join(' ').slice(0, 700).trim();
}

setEvidenceRecords(evidenceRecords);

function mergeEvidenceRecords(primary: EvidenceRecord[], secondary: EvidenceRecord[]) {
  const byId = new Map<string, EvidenceRecord>();
  for (const record of [...primary, ...secondary]) byId.set(record.id, record);
  return [...byId.values()];
}


function buildTopicCounts(records: EvidenceRecord[]) {
  const counts = new Map<string, number>();
  for (const record of records) {
    for (const topic of record.topics) {
      const normalizedTopic = normalizeText(topic);
      counts.set(normalizedTopic, (counts.get(normalizedTopic) || 0) + 1);
    }
  }
  return counts;
}

function countMatchingRecords(topic: string) {
  return internalTopicCounts.get(normalizeText(topic)) || 0;
}

export async function getEvidenceCatalog() {
  await loadEvidenceStore();

  return {
    offlineReady: true,
    totalRecords: evidenceRecords.length,
    totalInternalRecords: internalSeedRecords.length,
    totalGeneratedRecords: massiveSeedRecords.length,
    domains: MASSIVE_SEED_DOMAINS.map((domain) => ({
      id: domain.id,
      label: domain.label,
      presentations: [...domain.presentations],
      recordCount: countMatchingRecords(domain.id),
    })),
    dimensions: MASSIVE_SEED_DIMENSIONS.map((dimension) => ({
      id: dimension.id,
      title: dimension.title,
      focus: dimension.focus,
      recordCount: countMatchingRecords(dimension.id),
    })),
    contexts: INTERNAL_CONTEXT_LAYERS.map((context) => ({
      id: context.id,
      label: context.label,
      lens: context.lens,
      recordCount: countMatchingRecords(context.id),
    })),
    sampleQueries: [
      'dor torácica cardiologia emergência red flags',
      'dispneia respiratório teletriagem sinais de alarme',
      'febre infantil pediatria reavaliação',
      'dor pélvica gineco-obstetrícia gestação',
      'confusão idoso emergência medicamentos',
    ],
    safety: 'Catálogo interno para estudo e simulação; não substitui avaliação profissional, protocolos institucionais ou diretrizes locais.',
  };
}

function sourceToRecord(source: EvidenceSource, rawHtml: string): EvidenceRecord {
  const title = extractTitle(rawHtml, source.name);
  const text = stripHtml(rawHtml).slice(0, MAX_REMOTE_TEXT_CHARS);
  const now = new Date().toISOString();

  return {
    id: `remote-${source.id}-${recordHash(`${source.url}:${title}:${text.slice(0, 500)}`)}`,
    title,
    sourceId: source.id,
    sourceName: source.name,
    sourceUrl: source.url,
    topics: source.topics,
    summary: summarize(text) || `Fonte monitorada: ${source.name}`,
    content: text,
    retrievedAt: now,
    updatedAt: now,
    confidence: 'remote-refreshed',
  };
}

async function persistEvidenceStore() {
  const payload = { savedAt: new Date().toISOString(), records: evidenceRecords, lastRefreshAt };
  await fs.writeFile(EVIDENCE_STORE_FILE, JSON.stringify(payload), 'utf-8');
}

export async function loadEvidenceStore() {
  if (loadedFromDisk) return evidenceRecords;
  loadedFromDisk = true;

  try {
    const raw = await fs.readFile(EVIDENCE_STORE_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as { records?: EvidenceRecord[]; lastRefreshAt?: string | null };
    if (Array.isArray(parsed.records) && parsed.records.length > 0) {
      setEvidenceRecords(mergeEvidenceRecords(internalSeedRecords, parsed.records));
      lastRefreshAt = parsed.lastRefreshAt || null;
    }
  } catch {
    // Keep seed records when the optional disk cache does not exist or is invalid.
  }

  return evidenceRecords;
}

export async function getEvidenceStatus() {
  await loadEvidenceStore();
  const remoteRecords = evidenceRecords.filter((record) => record.confidence === 'remote-refreshed').length;

  return {
    records: evidenceRecords.length,
    seedRecords: evidenceRecords.length - remoteRecords,
    curatedSeedRecords: seedRecords.length,
    massiveSeedRecords: massiveSeedRecords.length,
    internalContexts: INTERNAL_CONTEXT_LAYERS.length,
    internalDomains: MASSIVE_SEED_DOMAINS.length,
    internalDimensions: MASSIVE_SEED_DIMENSIONS.length,
    internalMode: true,
    remoteRecords,
    sources: evidenceSources.length,
    sourceRegistry: evidenceSources,
    lastRefreshAt,
    remoteRefreshEnabled: process.env.EVIDENCE_AGENT_ALLOW_REMOTE === 'true',
    storeFile: EVIDENCE_STORE_FILE,
    safety: 'Base para estudo e contexto educacional; não substitui diretrizes locais, revisão médica ou decisão clínica real.',
  };
}

export async function searchEvidence(params: EvidenceSearchParams) {
  await loadEvidenceStore();
  const limit = Math.min(Math.max(params.limit || 8, 1), 20);
  const terms = tokenize([params.query || '', params.topic || ''].join(' '));
  const topic = normalizeText(params.topic || '');
  const domain = normalizeText(params.domain || '');
  const context = normalizeText(params.context || '');
  const dimension = normalizeText(params.dimension || '');

  const scored = evidenceSearchIndex
    .map(({ record, haystack, titleText }): EvidenceSearchResult => {
      const matchedTerms = terms.filter((term) => haystack.includes(term));
      const normalizedTopics = record.topics.map((item) => normalizeText(item));
      const topicBoost = topic && normalizedTopics.some((item) => item.includes(topic)) ? 3 : 0;
      const domainBoost = domain && normalizedTopics.some((item) => item === domain || item.includes(domain)) ? 4 : 0;
      const contextBoost = context && normalizedTopics.some((item) => item === context || item.includes(context)) ? 4 : 0;
      const dimensionBoost = dimension && normalizedTopics.some((item) => item === dimension || item.includes(dimension)) ? 4 : 0;
      const titleBoost = matchedTerms.filter((term) => titleText.includes(term)).length * 2;
      return {
        ...record,
        score: matchedTerms.length + topicBoost + domainBoost + contextBoost + dimensionBoost + titleBoost,
        matchedTerms,
      };
    })
    .filter((record) => (terms.length > 0 || topic || domain || context || dimension ? record.score > 0 : true))
    .sort((a, b) => b.score - a.score || b.retrievedAt.localeCompare(a.retrievedAt));

  return scored.slice(0, limit);
}


function uniqueByText(items: string[], limit: number) {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const item of items) {
    const normalized = normalizeText(item);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(item);
    if (output.length >= limit) break;
  }

  return output;
}

export async function getEvidenceBrief(params: EvidenceSearchParams) {
  const results = await searchEvidence({ ...params, limit: Math.min(Math.max(params.limit || 12, 6), 20) });
  const topicTrail = uniqueByText(results.flatMap((record) => record.topics), 12);
  const topSummaries = uniqueByText(results.map((record) => record.summary), 5);
  const contextHits = INTERNAL_CONTEXT_LAYERS.filter((context) =>
    results.some((record) => record.topics.some((topic) => normalizeText(topic) === normalizeText(context.id) || normalizeText(topic) === normalizeText(context.label))),
  );
  const dimensionHits = MASSIVE_SEED_DIMENSIONS.filter((dimension) =>
    results.some((record) => record.topics.some((topic) => normalizeText(topic) === normalizeText(dimension.id))),
  );

  const sections: EvidenceBriefSection[] = [
    {
      title: 'síntese educacional',
      items: topSummaries,
    },
    {
      title: 'camadas contextuais acionadas',
      items: contextHits.slice(0, 5).map((context) => `${context.label}: ${context.lens}`),
    },
    {
      title: 'dimensões de raciocínio cobertas',
      items: dimensionHits.slice(0, 6).map((dimension) => `${dimension.title}: ${dimension.focus}`),
    },
    {
      title: 'perguntas para refinar a anamnese',
      items: [
        'Qual foi o início, evolução temporal, intensidade e fator desencadeante do sintoma principal?',
        'Há instabilidade, alteração de sinais vitais, confusão, síncope, dor intensa ou piora progressiva?',
        'Quais comorbidades, medicações, alergias, imunossupressão, gestação/puerpério ou vulnerabilidades mudam o risco?',
        'Quais negativos pertinentes ajudam a separar hipóteses prováveis de diagnósticos graves a excluir?',
      ],
    },
  ].filter((section) => section.items.length > 0);

  return {
    query: params.query || '',
    topic: params.topic || '',
    domain: params.domain || '',
    context: params.context || '',
    dimension: params.dimension || '',
    evidenceCount: results.length,
    topicTrail,
    sections,
    topRecords: results.slice(0, 6).map((record) => ({
      id: record.id,
      title: record.title,
      score: record.score,
      matchedTerms: record.matchedTerms,
      sourceName: record.sourceName,
      summary: record.summary,
      topics: record.topics,
    })),
    safety: 'Brief interno para estudo, simulação e raciocínio estruturado; não substitui avaliação médica, protocolo local ou decisão clínica real.',
  };
}


function topicSetFromResults(results: EvidenceSearchResult[]) {
  return new Set(results.flatMap((record) => record.topics.map((topic) => normalizeText(topic))));
}

export async function getEvidenceCoverage(params: EvidenceSearchParams) {
  const results = await searchEvidence({ ...params, limit: 20 });
  const topics = topicSetFromResults(results);
  const matchedDomains = MASSIVE_SEED_DOMAINS.filter((domain) => topics.has(normalizeText(domain.id)) || topics.has(normalizeText(domain.label))).map((domain) => ({
    id: domain.id,
    label: domain.label,
  }));
  const matchedContexts = INTERNAL_CONTEXT_LAYERS.filter((context) => topics.has(normalizeText(context.id)) || topics.has(normalizeText(context.label))).map((context) => ({
    id: context.id,
    label: context.label,
    lens: context.lens,
  }));
  const matchedDimensions = MASSIVE_SEED_DIMENSIONS.filter((dimension) => topics.has(normalizeText(dimension.id))).map((dimension) => ({
    id: dimension.id,
    title: dimension.title,
    focus: dimension.focus,
  }));
  const missingDimensions = MASSIVE_SEED_DIMENSIONS.filter((dimension) => !topics.has(normalizeText(dimension.id))).map((dimension) => ({
    id: dimension.id,
    title: dimension.title,
    focus: dimension.focus,
  }));
  const coverageScore = Math.round((matchedDimensions.length / MASSIVE_SEED_DIMENSIONS.length) * 100);
  const baseQuery = uniqueByText([params.query || '', params.topic || '', params.domain || ''].filter(Boolean), 3).join(' ').trim() || 'caso clínico';
  const prioritizedGaps = missingDimensions.length > 0
    ? missingDimensions.slice(0, 4).map((dimension) => `Explorar ${dimension.title}: ${dimension.focus}.`)
    : matchedDimensions.slice(0, 4).map((dimension) => `Aprofundar ${dimension.title}: ${dimension.focus}.`);
  const suggestedQueries = missingDimensions.length > 0
    ? missingDimensions.slice(0, 4).map((dimension) => `${baseQuery} ${dimension.id}`)
    : matchedDimensions.slice(0, 4).map((dimension) => `${baseQuery} ${dimension.id} aprofundamento`);

  return {
    query: params.query || '',
    topic: params.topic || '',
    domain: params.domain || '',
    context: params.context || '',
    dimension: params.dimension || '',
    evidenceCount: results.length,
    coverageScore,
    matchedDomains,
    matchedContexts,
    matchedDimensions,
    missingDimensions,
    prioritizedGaps,
    suggestedQueries,
    safety: 'Cobertura interna para orientar estudo e revisão de lacunas; não é validação diagnóstica nem recomendação clínica real.',
  };
}


function inferDomainFromText(text: string) {
  const normalized = normalizeText(text);
  const domainScores = MASSIVE_SEED_DOMAINS.map((domain) => {
    const score = domain.presentations.filter((presentation) => normalized.includes(normalizeText(presentation))).length
      + (normalized.includes(normalizeText(domain.label)) || normalized.includes(domain.id) ? 2 : 0);
    return { domain, score };
  }).sort((a, b) => b.score - a.score);

  return domainScores[0]?.score > 0 ? domainScores[0].domain.id : '';
}

function inferContextFromCase(params: EvidenceCaseContextParams) {
  const normalized = normalizeText([params.symptoms, params.triageLevel || '', params.duration || ''].join(' '));
  if (params.age !== undefined && params.age < 14) return 'pediatrico';
  if (params.age !== undefined && params.age >= 65) return 'idoso';
  if (/emergencia|urgente|choque|síncope|sincope|hipoxemia|dispneia intensa|dor toracica/.test(normalized)) return 'emergencia';
  if (/gestacao|gestante|puerperio|puerpério/.test(normalized)) return 'gestacao';
  if (/imunossupress|transplante|quimioterapia|hiv|neutropenia/.test(normalized)) return 'imunossupressao';
  return 'reavaliacao';
}

function inferDimensionFromCase(params: EvidenceCaseContextParams) {
  const normalized = normalizeText([params.symptoms, params.triageLevel || ''].join(' '));
  if (/choque|síncope|sincope|confus|hipoxemia|sangramento|dor intensa|rigidez nucal|sepse/.test(normalized)) return 'red-flags';
  if (/exame|ecg|hemograma|imagem|troponina|gasometria/.test(normalized)) return 'tests';
  if (/diferencial|hipotese|hipótese/.test(normalized)) return 'differential';
  return 'triage';
}

export async function getEvidenceCaseContext(params: EvidenceCaseContextParams) {
  const hypothesesText = (params.hypotheses || []).join(' ');
  const query = uniqueByText([params.symptoms, hypothesesText, params.duration || '', params.triageLevel || ''].filter(Boolean), 4).join(' ');
  const domain = inferDomainFromText([params.symptoms, hypothesesText].join(' '));
  const context = inferContextFromCase(params);
  const dimension = inferDimensionFromCase(params);
  const searchParams = { query, domain, context, dimension, limit: params.limit || 8 };
  const [brief, coverage, results] = await Promise.all([
    getEvidenceBrief(searchParams),
    getEvidenceCoverage(searchParams),
    searchEvidence(searchParams),
  ]);

  return {
    query,
    inferred: {
      domain,
      context,
      dimension,
    },
    caseSignals: {
      age: params.age,
      duration: params.duration || '',
      triageLevel: params.triageLevel || '',
      hypotheses: params.hypotheses || [],
    },
    brief,
    coverage,
    topEvidence: results.slice(0, Math.min(params.limit || 8, 12)).map((record) => ({
      id: record.id,
      title: record.title,
      score: record.score,
      summary: record.summary,
      topics: record.topics,
      sourceName: record.sourceName,
    })),
    nextSteps: [
      'Conferir red flags e sinais vitais antes de aprofundar hipóteses educacionais.',
      'Completar anamnese com cronologia, fatores associados, negativos pertinentes e vulnerabilidades.',
      'Comparar hipóteses prováveis com condições graves a excluir dentro do domínio sugerido.',
      'Usar cobertura/lacunas para direcionar revisão, não para decisão clínica real.',
    ],
    safety: 'Contexto de evidência interno para simulação e estudo; não substitui avaliação médica, protocolos locais ou conduta clínica real.',
  };
}

export async function refreshEvidenceFromSources() {
  await loadEvidenceStore();
  if (process.env.EVIDENCE_AGENT_ALLOW_REMOTE !== 'true') {
    return {
      refreshed: false,
      reason: 'Remote refresh disabled. Set EVIDENCE_AGENT_ALLOW_REMOTE=true to enable curated source fetching.',
      records: evidenceRecords.length,
    };
  }

  const refreshed: EvidenceRecord[] = [];
  const refreshableSources = evidenceSources.filter((source) => source.kind !== 'internal-kb');

  for (const source of refreshableSources.slice(0, MAX_RECORDS_PER_REFRESH)) {
    try {
      const response = await fetch(source.url, {
        headers: {
          'User-Agent': 'ClinicIntuitionEvidenceAgent/1.0 educational updater',
        },
      });
      if (!response.ok) continue;
      const html = await response.text();
      refreshed.push(sourceToRecord(source, html));
    } catch {
      // Source refresh is opportunistic; failed sources remain covered by seed/cache records.
    }
  }

  if (refreshed.length > 0) {
    const byId = new Map(evidenceRecords.map((record) => [record.id, record]));
    for (const record of refreshed) byId.set(record.id, record);
    setEvidenceRecords([...byId.values()]);
    lastRefreshAt = new Date().toISOString();
    await persistEvidenceStore();
  }

  return {
    refreshed: refreshed.length > 0,
    added: refreshed.length,
    records: evidenceRecords.length,
    lastRefreshAt,
  };
}
