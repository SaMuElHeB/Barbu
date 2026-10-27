import type { Contract, RuleSet } from './types';

export const uid = () => Math.random().toString(36).slice(2, 10);

export const CLASSIC: RuleSet = {
  id: 'classique',
  name: 'Classique',
  builtIn: true,
  contracts: [
    { id: 'barbu', kind: 'slots', name: 'Barbu', emoji: '🧔', enabled: true,
      slots: [{ label: 'Roi de cœur', points: -20 }] },
    { id: 'coeurs', kind: 'perItem', name: 'Pas de cœurs', emoji: '♥️', enabled: true,
      target: 'hearts', pointsPerItem: -2 },
    { id: 'dames', kind: 'perItem', name: 'Pas de dames', emoji: '👸', enabled: true,
      target: 'queens', pointsPerItem: -6 },
    { id: 'plis', kind: 'perItem', name: 'Pas de plis', emoji: '🃏', enabled: true,
      target: 'tricks', pointsPerItem: -2 },
    { id: 'derniers', kind: 'slots', name: 'Derniers plis', emoji: '🔚', enabled: true,
      slots: [{ label: 'Avant-dernier pli', points: -10 }, { label: 'Dernier pli', points: -20 }] },
    { id: 'salade', kind: 'composite', name: 'Salade', emoji: '🥗', enabled: true,
      parts: ['barbu', 'coeurs', 'dames', 'plis', 'derniers'], multiplier: 1 },
    { id: 'reussite', kind: 'ranking', name: 'Réussite', emoji: '🏆', enabled: true,
      points: [40, 20, 10, 0, 0, 0] },
  ],
};

export const SIMPLE: RuleSet = {
  id: 'simple',
  name: 'Sans salade ni réussite',
  builtIn: true,
  contracts: CLASSIC.contracts.map((c) =>
    c.kind === 'composite' || c.kind === 'ranking' ? { ...c, enabled: false } : c,
  ),
};

export const BUILT_IN_RULES = [CLASSIC, SIMPLE];

export function newContract(kind: Contract['kind']): Contract {
  const base = { id: uid(), enabled: true };
  switch (kind) {
    case 'perItem':
      return { ...base, kind, name: 'Nouveau contrat', emoji: '🂠', target: 'tricks', pointsPerItem: -1 };
    case 'slots':
      return { ...base, kind, name: 'Carte précise', emoji: '🎯', slots: [{ label: 'Carte', points: -10 }] };
    case 'ranking':
      return { ...base, kind, name: 'Classement', emoji: '🏁', points: [30, 15, 5, 0, 0, 0] };
    case 'composite':
      return { ...base, kind, name: 'Combiné', emoji: '🥗', parts: [], multiplier: 1 };
  }
}

export const KIND_LABEL: Record<Contract['kind'], string> = {
  perItem: 'Points par élément (plis, cœurs, dames…)',
  slots: 'Carte ou pli précis (Barbu, dernier pli…)',
  ranking: 'Classement (Réussite, Domino…)',
  composite: 'Combinaison de contrats (Salade)',
};

export const TARGET_LABEL = {
  tricks: 'plis',
  hearts: 'cœurs',
  queens: 'dames',
  kings: 'rois',
  custom: 'éléments',
} as const;
