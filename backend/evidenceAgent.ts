import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';

export type EvidenceSourceKind = 'guideline' | 'public-health' | 'reference' | 'repository';

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
  confidence: 'seed' | 'remote-refreshed';
}

export interface EvidenceSearchResult extends EvidenceRecord {
  score: number;
  matchedTerms: string[];
}

const EVIDENCE_STORE_FILE = process.env.EVIDENCE_STORE_FILE || '/tmp/clinic-intuition-evidence-kb.json';
const MAX_REMOTE_TEXT_CHARS = 18_000;
const MAX_RECORDS_PER_REFRESH = 12;

export const evidenceSources: EvidenceSource[] = [
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
        const id = `massive-seed-${domain.id}-${normalizeText(presentation).replace(/\s+/g, '-')}-${dimension.id}`;
        const title = `${domain.label}: ${presentation} — ${dimension.title}`;
        const summary = `Base educacional para ${presentation} em ${domain.label}, com foco em ${dimension.focus}.`;

        records.push({
          id,
          title,
          sourceId: 'massive-local-seed',
          sourceName: 'Base massiva educacional local',
          sourceUrl: `local://massive-seed/${domain.id}/${dimension.id}`,
          topics: [domain.id, domain.label.toLowerCase(), presentation, dimension.id, 'educacional'],
          summary,
          content: [
            summary,
            `Checklist sugerido: identificar início, evolução, intensidade, fatores associados e negativos relevantes para ${presentation}.`,
            `Prioridade: reconhecer instabilidade, sinais vitais alterados, red flags e necessidade de avaliação presencial quando aplicável.`,
            `Diferenciais: organizar hipóteses prováveis e condições graves a excluir dentro de ${domain.label}, sem concluir diagnóstico definitivo.`,
            `Exames: pensar em investigação inicial contextual e protocolos institucionais, sempre com supervisão profissional.`,
            'Aviso: conteúdo para estudo, simulação e apoio educacional; não substitui avaliação médica, diretriz local ou decisão clínica real.',
          ].join(' '),
          retrievedAt,
          confidence: 'seed',
        });
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

let evidenceRecords = [...seedRecords, ...massiveSeedRecords];
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
      evidenceRecords = parsed.records;
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
    massiveSeedRecords: massiveSeedRecords.length,
    remoteRecords,
    sources: evidenceSources.length,
    sourceRegistry: evidenceSources,
    lastRefreshAt,
    remoteRefreshEnabled: process.env.EVIDENCE_AGENT_ALLOW_REMOTE === 'true',
    storeFile: EVIDENCE_STORE_FILE,
    safety: 'Base para estudo e contexto educacional; não substitui diretrizes locais, revisão médica ou decisão clínica real.',
  };
}

export async function searchEvidence(params: { query?: string; topic?: string; limit?: number }) {
  await loadEvidenceStore();
  const limit = Math.min(Math.max(params.limit || 8, 1), 20);
  const terms = tokenize([params.query || '', params.topic || ''].join(' '));
  const topic = normalizeText(params.topic || '');

  const scored = evidenceRecords
    .map((record): EvidenceSearchResult => {
      const haystack = normalizeText([record.title, record.summary, record.content, record.topics.join(' ')].join(' '));
      const matchedTerms = terms.filter((term) => haystack.includes(term));
      const topicBoost = topic && record.topics.some((item) => normalizeText(item).includes(topic)) ? 3 : 0;
      const titleBoost = matchedTerms.filter((term) => normalizeText(record.title).includes(term)).length * 2;
      return {
        ...record,
        score: matchedTerms.length + topicBoost + titleBoost,
        matchedTerms,
      };
    })
    .filter((record) => (terms.length > 0 || topic ? record.score > 0 : true))
    .sort((a, b) => b.score - a.score || b.retrievedAt.localeCompare(a.retrievedAt));

  return scored.slice(0, limit);
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
  for (const source of evidenceSources.slice(0, MAX_RECORDS_PER_REFRESH)) {
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
    evidenceRecords = [...byId.values()];
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
