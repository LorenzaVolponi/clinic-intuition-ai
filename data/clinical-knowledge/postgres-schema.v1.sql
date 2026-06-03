-- Clinical knowledge schema v1
-- Intended for Postgres. Enable pgvector in a later migration only when semantic search is introduced.

create table if not exists clinical_sources (
  id text primary key,
  source_type text not null check (source_type in ('guideline', 'book', 'article', 'icd', 'pubmed', 'local_core', 'institutional')),
  title text not null,
  url text not null,
  license text not null,
  publisher text not null,
  year integer not null check (year >= 1900),
  retrieved_at date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists clinical_conditions (
  id text primary key,
  name text not null,
  icd10 text,
  icd11 text,
  category text not null,
  urgency_level text not null check (urgency_level in ('baixa', 'moderada', 'alta', 'emergencia')),
  summary text,
  common_symptoms jsonb not null default '[]'::jsonb,
  risk_factors jsonb not null default '[]'::jsonb,
  age_groups jsonb not null default '[]'::jsonb,
  gender_preference text check (gender_preference in ('masculino', 'feminino', 'both')),
  treatments jsonb not null default '[]'::jsonb,
  differentials jsonb not null default '[]'::jsonb,
  red_flags jsonb not null default '[]'::jsonb,
  clinical_pearls jsonb not null default '[]'::jsonb,
  recommended_exams jsonb not null default '[]'::jsonb,
  duration_profile jsonb,
  version integer not null check (version > 0),
  status text not null check (status in ('draft', 'reviewed', 'published', 'deprecated')),
  last_reviewed_at date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists clinical_assertions (
  id text primary key,
  subject text not null,
  predicate text not null check (predicate in ('supports_condition', 'has_red_flag', 'has_differential', 'requires_exam', 'suggests_action')),
  object text not null,
  condition_id text references clinical_conditions(id),
  source_id text not null references clinical_sources(id),
  confidence numeric(4,3) not null check (confidence >= 0 and confidence <= 1),
  evidence_level text not null check (evidence_level in ('local_core', 'expert_review', 'guideline', 'systematic_review', 'primary_study', 'metadata_only')),
  review_status text not null check (review_status in ('draft', 'reviewed', 'published', 'deprecated')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_clinical_conditions_status on clinical_conditions(status);
create index if not exists idx_clinical_conditions_category on clinical_conditions(category);
create index if not exists idx_clinical_conditions_urgency on clinical_conditions(urgency_level);
create index if not exists idx_clinical_assertions_predicate on clinical_assertions(predicate);
create index if not exists idx_clinical_assertions_subject on clinical_assertions(subject);
create index if not exists idx_clinical_assertions_condition on clinical_assertions(condition_id);
create index if not exists idx_clinical_assertions_source on clinical_assertions(source_id);
create index if not exists idx_clinical_assertions_review_status on clinical_assertions(review_status);
