import { describe, expect, it } from 'vitest';
import { CLASSIC } from './rules';
import type { Game, PerItemContract } from './types';
import { itemTotal, nextDealer, remainingFor, scoreRound, totals, validatePart } from './scoring';

const game = (deck: 32 | 52 = 52): Game => ({
  id: 'g', createdAt: 0, players: ['A', 'B', 'C', 'D'], deck, rules: CLASSIC, firstDealer: 0, rounds: [],
});
const c = (id: string) => CLASSIC.contracts.find((x) => x.id === id)!;

describe('totaux selon le jeu', () => {
  it('52 cartes : 13 plis, 13 cœurs', () => {
    expect(itemTotal(c('plis') as PerItemContract, { deck: 52, players: 4 })).toBe(13);
    expect(itemTotal(c('coeurs') as PerItemContract, { deck: 52, players: 4 })).toBe(13);
  });
  it('32 cartes : 8 plis, 8 cœurs', () => {
    expect(itemTotal(c('plis') as PerItemContract, { deck: 32, players: 4 })).toBe(8);
    expect(itemTotal(c('coeurs') as PerItemContract, { deck: 32, players: 4 })).toBe(8);
  });
});

describe('scores', () => {
  const ctx = { deck: 52 as const, players: 4 };
  it('pas de dames', () => {
    const s = scoreRound({ id: 'r', dealer: 0, contractId: 'dames', inputs: { dames: [2, 1, 1, 0] } }, CLASSIC, ctx);
    expect(s).toEqual([-12, -6, -6, 0]);
  });
  it('barbu et derniers plis', () => {
    expect(scoreRound({ id: 'r', dealer: 0, contractId: 'barbu', inputs: { barbu: [2] } }, CLASSIC, ctx))
      .toEqual([0, 0, -20, 0]);
    expect(scoreRound({ id: 'r', dealer: 0, contractId: 'derniers', inputs: { derniers: [1, 1] } }, CLASSIC, ctx))
      .toEqual([0, -30, 0, 0]);
  });
  it('réussite', () => {
    expect(scoreRound({ id: 'r', dealer: 0, contractId: 'reussite', inputs: { reussite: [3, 0, 2, 1] } }, CLASSIC, ctx))
      .toEqual([20, 0, 10, 40]);
  });
  it('salade = somme des contrats', () => {
    const s = scoreRound({
      id: 'r', dealer: 0, contractId: 'salade',
      inputs: { barbu: [0], coeurs: [13, 0, 0, 0], dames: [0, 4, 0, 0], plis: [4, 3, 3, 3], derniers: [3, 3] },
    }, CLASSIC, ctx);
    expect(s).toEqual([-20 - 26 - 8, -24 - 6, -6, -6 - 30]);
  });
  it('validation des totaux', () => {
    expect(validatePart(c('plis') as PerItemContract, [4, 3, 3, 2], ctx)).toMatch(/12 plis sur 13/);
    expect(validatePart(c('plis') as PerItemContract, [4, 3, 3, 3], ctx)).toBeNull();
  });
});

describe('déroulement', () => {
  it('le donneur garde la main jusqu’à avoir joué ses 7 contrats', () => {
    const g = game();
    expect(nextDealer(g)).toBe(0);
    for (const ct of CLASSIC.contracts) g.rounds.push({ id: ct.id, dealer: 0, contractId: ct.id, inputs: {} });
    expect(remainingFor(g, 0)).toHaveLength(0);
    expect(nextDealer(g)).toBe(1);
    expect(totals(g)).toHaveLength(4);
  });
});
