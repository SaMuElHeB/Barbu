import { describe, expect, it } from 'vitest';
import { DEFAULT_RULES } from './rules';
import type { Game, PerItemContract } from './types';
import { isOver, itemTotal, scoreLine, totals, validatePart } from './scoring';

const R = DEFAULT_RULES;
const c = (id: string) => R.contracts.find((x) => x.id === id)!;
const ctx = { deck: 52 as const, players: 4 };

describe('totaux selon le jeu', () => {
  it('52 cartes : 13 plis, 13 cœurs', () => {
    expect(itemTotal(c('plis') as PerItemContract, ctx)).toBe(13);
    expect(itemTotal(c('coeurs') as PerItemContract, ctx)).toBe(13);
  });
  it('32 cartes : 8 plis, 8 cœurs', () => {
    expect(itemTotal(c('plis') as PerItemContract, { deck: 32, players: 4 })).toBe(8);
    expect(itemTotal(c('coeurs') as PerItemContract, { deck: 32, players: 4 })).toBe(8);
  });
});

describe('points par ligne', () => {
  it('pas de dames', () => {
    expect(scoreLine(c('dames'), { dames: [2, 1, 1, 0] }, R, ctx)).toEqual([-12, -6, -6, 0]);
  });
  it('roi de cœur et 2 derniers plis', () => {
    expect(scoreLine(c('roi'), { roi: [2] }, R, ctx)).toEqual([0, 0, -20, 0]);
    expect(scoreLine(c('derniers'), { derniers: [1, 1] }, R, ctx)).toEqual([0, -30, 0, 0]);
  });
  it('réussite', () => {
    expect(scoreLine(c('reussite'), { reussite: [3, 0, 2, 1] }, R, ctx)).toEqual([20, 0, 10, 40]);
  });
  it('salade = somme des lignes', () => {
    const s = scoreLine(c('salade'), {
      roi: [0], coeurs: [13, 0, 0, 0], dames: [0, 4, 0, 0], plis: [4, 3, 3, 3], derniers: [3, 3],
    }, R, ctx);
    expect(s).toEqual([-20 - 26 - 8, -24 - 6, -6, -6 - 30]);
  });
  it('vérifie les totaux', () => {
    expect(validatePart(c('plis') as PerItemContract, [4, 3, 3, 2], ctx)).toMatch(/12 plis sur 13/);
    expect(validatePart(c('plis') as PerItemContract, [4, 3, 3, 3], ctx)).toBeNull();
  });
});

describe('partie', () => {
  it('total cumulé et fin de partie', () => {
    const g: Game = { id: 'g', createdAt: 0, players: ['A', 'B', 'C', 'D'], deck: 52, rules: R, results: {} };
    g.results.dames = { dames: [4, 0, 0, 0] };
    g.results.roi = { roi: [1] };
    expect(totals(g)).toEqual([-24, -20, 0, 0]);
    expect(isOver(g)).toBe(false);
  });
});
