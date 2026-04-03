import { describe, expect, it } from 'vitest';
import { extractCaseFacts } from './parser';

describe('extractCaseFacts', () => {
  it('extrai sintomas, medicações e ações explícitas do relato livre', () => {
    const parsed = extractCaseFacts({
      symptoms: 'Cefaleia intensa com aura visual, palpitações e náusea. Usou dipirona e recebeu soro.',
      duration: '6-24h',
    });

    expect(parsed.explicitSymptoms).toEqual(expect.arrayContaining(['cefaleia', 'aura', 'palpitações', 'náusea']));
    expect(parsed.mentionedMedications).toContain('dipirona');
    expect(parsed.reportedActions).toContain('soro');
  });
});
