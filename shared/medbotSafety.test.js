import { describe, expect, it } from 'vitest';
import { isMedbotAnswerSafe } from './medbotSafety.js';

describe('isMedbotAnswerSafe', () => {
  it('aceita resposta médica ancorada no tema', () => {
    expect(
      isMedbotAnswerSafe({
        topicId: 'cardiologia',
        text: 'Na cardiologia, priorize triagem, red flags e ECG inicial.',
      }),
    ).toBe(true);
  });

  it('rejeita conteúdo não médico/indevido', () => {
    expect(
      isMedbotAnswerSafe({
        topicId: 'cardiologia',
        text: 'Vamos falar de apostas esportivas e trading de bitcoin.',
      }),
    ).toBe(false);
  });
});
