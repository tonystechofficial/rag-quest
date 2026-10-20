import { evaluateChunking } from './chunk-lab';

const document =
  'Alpha facts: the sky is blue. Beta facts: the grass is green and the sun is bright. ' +
  'Gamma facts: the sea is deep and the sand is warm.';

const questions = [{ q: 'What colour is the grass?', keywords: ['grass', 'green'] }];

describe('evaluateChunking', () => {
  it('counts a question as answered when one retrieved chunk holds every keyword', () => {
    const report = evaluateChunking(document, questions, 30, 0);
    expect(report.chunks).toHaveLength(1);
    expect(report.hits).toBe(1);
    expect(report.results[0].hit).toBe(true);
    expect(report.results[0].retrieved[0].id).toBe('c0');
  });

  it('counts a miss when the fact is cut across two chunks', () => {
    const report = evaluateChunking(document, questions, 5, 0);
    expect(report.hits).toBe(0);
    expect(report.results[0].hit).toBe(false);
  });

  it('recovers the fact with enough overlap', () => {
    const report = evaluateChunking(document, questions, 5, 3);
    expect(report.hits).toBe(1);
  });

  it('measures efficiency as the share of the document NOT sent as context', () => {
    const whole = evaluateChunking(document, questions, 30, 0);
    expect(whole.efficiency).toBe(0);
    const small = evaluateChunking(document, questions, 5, 0);
    expect(small.efficiency).toBeCloseTo(1 - 10 / whole.documentWords);
  });

  it('scores 80% on hits and 20% on efficiency', () => {
    const whole = evaluateChunking(document, questions, 30, 0);
    expect(whole.score).toBe(80);
    const small = evaluateChunking(document, questions, 5, 0);
    expect(small.score).toBe(Math.round(20 * small.efficiency));
  });

  it('matches keywords case-insensitively and as substrings', () => {
    const report = evaluateChunking(
      'The Batteries are new.',
      [{ q: 'battery?', keywords: ['batter'] }],
      10,
      0,
    );
    expect(report.hits).toBe(1);
  });
});
