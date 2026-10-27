export type DeckSize = 32 | 52;

/** Ce qu'on compte dans une ligne « par élément ». */
export type CountTarget = 'tricks' | 'hearts' | 'queens';

interface BaseContract {
  id: string;
  name: string;
  emoji: string;
}

/** Points par élément ramassé : plis, cœurs, dames. */
export interface PerItemContract extends BaseContract {
  kind: 'perItem';
  target: CountTarget;
  pointsPerItem: number;
}

/** Carte ou pli précis attribué à un joueur : roi de cœur, 2 derniers plis. */
export interface SlotsContract extends BaseContract {
  kind: 'slots';
  slots: { label: string; points: number }[];
}

/** Classement à l'arrivée : Réussite. */
export interface RankingContract extends BaseContract {
  kind: 'ranking';
  /** Points du 1er, 2e, 3e… Les places non renseignées valent 0. */
  points: number[];
}

/** Salade : toutes les lignes négatives en même temps. */
export interface CompositeContract extends BaseContract {
  kind: 'composite';
  parts: string[];
  multiplier: number;
}

export type Contract = PerItemContract | SlotsContract | RankingContract | CompositeContract;
export type SimpleContract = PerItemContract | SlotsContract | RankingContract;

/** Barème : la liste des lignes du Barbu avec leurs valeurs. */
export interface RuleSet {
  contracts: Contract[];
}

/**
 * Saisie d'une ligne simple :
 * - perItem : nombre d'éléments ramassés par joueur
 * - slots   : index du joueur pour chaque carte / pli (null = pas encore choisi)
 * - ranking : index des joueurs dans l'ordre d'arrivée
 */
export type PartInput = (number | null)[];

/** Résultat d'une ligne (une salade contient une saisie par ligne qui la compose). */
export type LineResult = Record<string, PartInput>;

export interface Game {
  id: string;
  createdAt: number;
  players: string[];
  deck: DeckSize;
  /** Copie du barème au moment de créer la partie. */
  rules: RuleSet;
  /** clé = id de la ligne jouée */
  results: Record<string, LineResult>;
}
