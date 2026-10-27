import type { RuleSet } from './types';

export const uid = () => Math.random().toString(36).slice(2, 10);

/**
 * Barème par défaut, dans l'ordre de la feuille de score.
 * Les points sont des pénalités : le joueur qui a le MOINS de points gagne.
 */
export const DEFAULT_RULES: RuleSet = {
  contracts: [
    { id: 'plis', kind: 'perItem', name: 'Pas de plis', emoji: '🃏', target: 'tricks', pointsPerItem: 2 },
    { id: 'coeurs', kind: 'perItem', name: 'Pas de cœurs', emoji: '♥️', target: 'hearts', pointsPerItem: 2 },
    { id: 'dames', kind: 'perItem', name: 'Pas de dames', emoji: '👸', target: 'queens', pointsPerItem: 6 },
    { id: 'roi', kind: 'slots', name: 'Pas le roi de cœur', emoji: '🧔',
      slots: [{ label: 'Roi de cœur', points: 20 }] },
    { id: 'derniers', kind: 'slots', name: 'Pas les 2 derniers plis', emoji: '🔚',
      slots: [{ label: 'Avant-dernier pli', points: 10 }, { label: 'Dernier pli', points: 20 }] },
    { id: 'salade', kind: 'composite', name: 'Salade', emoji: '🥗',
      parts: ['plis', 'coeurs', 'dames', 'roi', 'derniers'], multiplier: 1 },
    { id: 'reussite', kind: 'ranking', name: 'Réussite', emoji: '🏆', points: [-40, -20, -10, 0, 0, 0] },
  ],
};

export const TARGET_LABEL = {
  tricks: { one: 'pli', many: 'plis' },
  hearts: { one: 'cœur', many: 'cœurs' },
  queens: { one: 'dame', many: 'dames' },
} as const;