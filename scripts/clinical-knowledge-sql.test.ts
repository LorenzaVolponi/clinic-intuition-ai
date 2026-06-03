import { describe, expect, it } from 'vitest';
import assertionsBundle from '../data/clinical-knowledge/assertions.v1.json';
import conditionsBundle from '../data/clinical-knowledge/conditions.v1.json';
import sourcesBundle from '../data/clinical-knowledge/sources.v1.json';
import { buildClinicalKnowledgeSeedSql, escapeSqlLiteral } from './clinical-knowledge-sql';

describe('clinical knowledge SQL exporter', () => {
  it('escapa literais SQL sem perder apóstrofos clínicos/textuais', () => {
    expect(escapeSqlLiteral("O'Brien")).toBe("'O''Brien'");
    expect(escapeSqlLiteral(undefined)).toBe('null');
  });

  it('gera seed transacional com fontes, condições e assertions', () => {
    const sql = buildClinicalKnowledgeSeedSql(conditionsBundle, sourcesBundle, assertionsBundle);

    expect(sql).toContain('begin;');
    expect(sql).toContain('commit;');
    expect(sql).toContain('insert into clinical_sources');
    expect(sql).toContain('insert into clinical_conditions');
    expect(sql).toContain('insert into clinical_assertions');
    expect(sql).toContain("'sindrome-coronariana-aguda'");
    expect(sql).toContain("'requires_exam'");
    expect(sql).toContain("'ECG'");
    expect(sql).toContain('on conflict (id) do update');
  });
});
