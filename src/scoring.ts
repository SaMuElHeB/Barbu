import type {
  Contract, DeckSize, Game, LineResult, PartInput, PerItemContract, RuleSet, SimpleContract,
} from './types';
import { TARGET_LABEL } from './rules';

export interface Ctx {
  deck: DeckSize;
  players: number;
}

export const ctxOf = (g: Game): Ctx => ({ deck: g.deck, players: g.players.length });

/** Nombre total d'éléments à répartir (plis, cœurs, dames). */
export function itemTotal(c: PerItemContract, ctx: Ctx): number {
  switch (c.target) {
    case 'tricks': return Math.floor(ctx.deck / ctx.players);
    case 'hearts': return ctx.deck / 4;
    case 'queens': return 4;
  }
}

export function findContract(rules: RuleSet, id: string): Contract | undefined {
  return rules.contracts.find((c) => c.id === id);
}

/** Lignes simples à saisir pour une ligne donnée (la salade en contient plusieurs). */
export function partsOf(c: Contract, rules: RuleSet): SimpleContract[] {
  if (c.kind !== 'composite') return [c];
  return c.parts
    .map((id) => findContract(rules, id))
    .filter((p): p is SimpleContract => !!p && p.kind !== 'composite');
}

export function emptyInput(c: SimpleContract, ctx: Ctx): PartInput {
  if (c.kind === 'perItem') return Array(ctx.players).fill(0);
  if (c.kind === 'slots') return c.slots.map(() => null);
  return [];
}

export function scorePart(c: SimpleContract, input: PartInput, ctx: Ctx): number[] {
  const s = Array(ctx.players).fill(0);
  if (c.kind === 'perItem') {
    input.forEach((n, i) => { s[i] += (n ?? 0) * c.pointsPerItem; });
  } else if (c.kind === 'slots') {
    input.forEach((p, k) => { if (p !== null && p !== undefined) s[p] += c.slots[k]?.points ?? 0; });
  } else {
    input.forEach((p, rank) => { if (p !== null && p !== undefined) s[p] += c.points[rank] ?? 0; });
  }
  return s;
}

/** Points de chaque joueur pour une ligne. */
export function scoreLine(c: Contract, result: LineResult, rules: RuleSet, ctx: Ctx): number[] {
  const total = Array(ctx.players).fill(0);
  const mult = c.kind === 'composite' ? c.multiplier : 1;
  for (const p of partsOf(c, rules)) {
    scorePart(p, result[p.id] ?? emptyInput(p, ctx), ctx).forEach((v, i) => { total[i] += v * mult; });
  }
  return total;
}

/** Message d'erreur si la saisie est incomplète, sinon null. */
export function validatePart(c: SimpleContract, input: PartInput, ctx: Ctx): string | null {
  if (c.kind === 'perItem') {
    const expected = itemTotal(c, ctx);
    const got = input.reduce<number>((a, b) => a + (b ?? 0), 0);
    return got === expected ? null : `${c.name} : ${got} ${TARGET_LABEL[c.target].many} sur ${expected}`;
  }
  if (c.kind === 'slots') {
    const missing = c.slots.filter((_, k) => input[k] === null || input[k] === undefined);
    return missing.length ? `Qui a pris : ${missing.map((m) => m.label.toLowerCase()).join(', ')} ?` : null;
  }
  return input.length === ctx.players ? null : `${c.name} : classez tous les joueurs`;
}

export function totals(game: Game): number[] {
  const ctx = ctxOf(game);
  const t = Array(ctx.players).fill(0);
  for (const c of game.rules.contracts) {
    const r = game.results[c.id];
    if (r) scoreLine(c, r, game.rules, ctx).forEach((v, i) => { t[i] += v; });
  }
  return t;
}

export const isOver = (g: Game) => g.rules.contracts.every((c) => g.results[c.id]);
