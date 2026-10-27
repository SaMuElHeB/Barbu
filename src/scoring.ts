import type {
  Contract, DeckSize, Game, PartInput, PerItemContract, Round, RuleSet, SimpleContract,
} from './types';
import { TARGET_LABEL } from './rules';

export interface Ctx {
  deck: DeckSize;
  players: number;
}

/** Nombre total d'éléments à répartir pour un contrat « par élément ». */
export function itemTotal(c: PerItemContract, ctx: Ctx): number {
  switch (c.target) {
    case 'tricks': return Math.floor(ctx.deck / ctx.players);
    case 'hearts': return ctx.deck / 4;
    case 'queens':
    case 'kings': return 4;
    case 'custom': return c.customTotal ?? 0;
  }
}

export function findContract(rules: RuleSet, id: string): Contract | undefined {
  return rules.contracts.find((c) => c.id === id);
}

/** Contrats simples à saisir pour un contrat donné (une salade en contient plusieurs). */
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

export function scoreRound(round: Round, rules: RuleSet, ctx: Ctx): number[] {
  const c = findContract(rules, round.contractId);
  const total = Array(ctx.players).fill(0);
  if (!c) return total;
  const mult = c.kind === 'composite' ? c.multiplier : 1;
  for (const p of partsOf(c, rules)) {
    const part = scorePart(p, round.inputs[p.id] ?? emptyInput(p, ctx), ctx);
    part.forEach((v, i) => { total[i] += v * mult; });
  }
  return total;
}

/** Retourne un message d'erreur si la saisie est incomplète, sinon null. */
export function validatePart(c: SimpleContract, input: PartInput, ctx: Ctx): string | null {
  if (c.kind === 'perItem') {
    const expected = itemTotal(c, ctx);
    const got = input.reduce<number>((a, b) => a + (b ?? 0), 0);
    if (got !== expected) {
      return `${c.name} : ${got} ${TARGET_LABEL[c.target]} sur ${expected}`;
    }
    return null;
  }
  if (c.kind === 'slots') {
    const missing = c.slots.filter((_, k) => input[k] === null || input[k] === undefined);
    return missing.length ? `${c.name} : qui a pris ${missing.map((m) => m.label.toLowerCase()).join(', ')} ?` : null;
  }
  return input.length === ctx.players ? null : `${c.name} : classez tous les joueurs`;
}

export function totals(game: Game): number[] {
  const ctx = { deck: game.deck, players: game.players.length };
  const t = Array(ctx.players).fill(0);
  for (const r of game.rounds) scoreRound(r, game.rules, ctx).forEach((v, i) => { t[i] += v; });
  return t;
}

export function activeContracts(rules: RuleSet): Contract[] {
  return rules.contracts.filter((c) => c.enabled);
}

/** Contrats que ce donneur n'a pas encore joués. */
export function remainingFor(game: Game, dealer: number): Contract[] {
  const played = new Set(game.rounds.filter((r) => r.dealer === dealer).map((r) => r.contractId));
  return activeContracts(game.rules).filter((c) => !played.has(c.id));
}

/** Prochain donneur : celui qui a la main finit ses contrats, puis on tourne. */
export function nextDealer(game: Game): number | null {
  const n = game.players.length;
  const start = game.rounds.length ? game.rounds[game.rounds.length - 1].dealer : game.firstDealer;
  for (let k = 0; k < n; k++) {
    const d = (start + k) % n;
    if (remainingFor(game, d).length) return d;
  }
  return null;
}

export function totalRounds(game: Game): number {
  return activeContracts(game.rules).length * game.players.length;
}
