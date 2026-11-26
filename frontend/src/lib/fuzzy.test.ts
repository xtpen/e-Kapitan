import { describe, expect, it } from 'vitest';
import { editDistance, fuzzyFilter, fuzzyScore } from './fuzzy';

const services = [
  { name: 'Documents', keys: 'certificate clearance residency indigency' },
  { name: 'Book the court', keys: 'basketball volleyball event' },
  { name: 'Report a problem', keys: 'noise garbage flood streetlight' },
  { name: 'Printing', keys: 'print pdf copy' },
];
const find = (q: string) => fuzzyFilter(services, q, s => ({ primary: s.name, secondary: s.keys })).map(s => s.name);

describe('fuzzy search', () => {
  it('counts a swap of two letters as one typo', () => {
    expect(editDistance('clearnace', 'clearance')).toBe(1);
  });

  it('finds words with typos', () => {
    expect(find('clerance')[0]).toBe('Documents');
    expect(find('basktball')[0]).toBe('Book the court');
    expect(find('garbge')[0]).toBe('Report a problem');
  });

  it('finds half-typed words and ranks name hits first', () => {
    expect(find('prin')[0]).toBe('Printing');
    expect(find('doc')[0]).toBe('Documents');
  });

  it('needs every typed word to match', () => {
    expect(find('court noise')).toEqual([]);
    expect(find('book basketball')).toEqual(['Book the court']);
  });

  it('does not match nonsense', () => {
    expect(find('zzqx')).toEqual([]);
    expect(fuzzyScore('', 'Documents')).toBe(0);
  });
});
