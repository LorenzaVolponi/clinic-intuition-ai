import { describe, expect, it } from 'vitest';
import { generateRandomStudyPack } from './studyContent';

describe('generateRandomStudyPack', () => {
  it('injects objective text into generated content', () => {
    const objective = 'Treinar manejo inicial de choque séptico';
    const pack = generateRandomStudyPack('infectologia', { objective, nonce: '12345' });

    expect(pack.lessons.length).toBeGreaterThan(0);
    expect(pack.quiz.length).toBeGreaterThan(0);
    expect(pack.flashcards.length).toBeGreaterThan(0);

    expect(pack.lessons.some((lesson) => lesson.content.includes(objective))).toBe(true);
    expect(pack.quiz.some((item) => item.question.includes(objective))).toBe(true);
    expect(pack.flashcards.some((card) => card.hint.includes(objective))).toBe(true);
    expect(pack.lessons[0].content).toContain('1) Gancho clínico');
    expect(pack.lessons[0].content).toContain('5) Resumo de bolso');
  });

  it('supports focus mode by returning only the requested content type', () => {
    const quizOnly = generateRandomStudyPack('cardiologia', { focus: 'quiz', nonce: '99999' });

    expect(quizOnly.quiz.length).toBeGreaterThan(0);
    expect(quizOnly.lessons).toEqual([]);
    expect(quizOnly.flashcards).toEqual([]);
  });

  it('uses provided nonce when present', () => {
    const pack = generateRandomStudyPack('neurologia', { objective: 'AVC agudo', nonce: 'abcde' });

    expect(pack.lessons[0].title).toContain('abcde');
    expect(pack.quiz[0].question).toContain('abcde-1');
    expect(pack.flashcards[0].question).toContain('abcde');
  });
});
