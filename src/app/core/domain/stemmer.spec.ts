import { stem } from './stemmer';
import { normalizeText } from './tfidf';

describe('stem', () => {
  it('maps regular plurals to the singular form', () => {
    expect(stem('customers')).toBe('customer');
    expect(stem('refunds')).toBe('refund');
    expect(stem('classes')).toBe('class');
  });

  it('maps -ies plurals and a trailing y to the same stem', () => {
    expect(stem('batteries')).toBe(stem('battery'));
    expect(stem('policies')).toBe(stem('policy'));
  });

  it('leaves short words alone', () => {
    expect(stem('is')).toBe('is');
    expect(stem('bus')).toBe('bus');
    expect(stem('yes')).toBe('yes');
  });

  it('is idempotent', () => {
    expect(stem(stem('batteries'))).toBe(stem('batteries'));
  });
});

describe('normalizeText with stemming', () => {
  it('stems after removing stopwords', () => {
    expect(
      normalizeText('The batteries of the bikes', { removeStopwords: true, stem: true }),
    ).toEqual(['batteri', 'bike']);
  });
});
