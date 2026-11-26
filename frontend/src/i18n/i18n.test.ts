import { describe, expect, it } from 'vitest';
import { translate } from './index';

describe('translate', () => {
  it('returns English unchanged in English mode', () => {
    expect(translate('en', 'Requests')).toBe('Requests');
  });

  it('looks up Filipino by the English text', () => {
    expect(translate('fil', 'Requests')).toBe('Mga request');
    expect(translate('fil', 'Dark mode')).toBe('Dark mode');
  });

  it('falls back to English when a phrase has no Filipino yet', () => {
    expect(translate('fil', 'A sentence nobody translated')).toBe('A sentence nobody translated');
  });

  it('fills in {placeholders} in both languages', () => {
    expect(translate('en', 'Back to {page}', { page: 'Home' })).toBe('Back to Home');
    expect(translate('fil', 'Back to {page}', { page: 'Home' })).toBe('Bumalik sa Home');
    expect(translate('fil', '{n} of {total}', { n: 2, total: 9 })).toBe('2 sa 9');
  });
});
