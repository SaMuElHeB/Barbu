export type DeckSize = 32 | 52;

/** Ce qu'on compte dans un contrat « par élément ». */
export type CountTarget = 'tricks' | 'hearts' | 'queens' | 'kings' | 'custom';

interface BaseContract {
  id: string;
  name: string;
  emoji: string;
  enabled: boolean;
}

/** Points par élément ramassé : plis, cœurs, dames… */
export interface PerItemContract extends BaseContract {
  kind: 'perItem';
  target: CountTarget;
  /** Total attendu quand target = 'custom'. */
  customTotal?: number;
  pointsPerItem: number;
}

/** Une ou plusieurs « cartes / plis précis » attribués à un joueur : Barbu, dernier pli… */
export interface SlotsContract extends BaseContract {
  kind: 'slots';
  slots: { label: string; points: number }[];
}

/** Classement à l'arrivée : Réussite / Domino. */
export interface RankingContract extends BaseContract {
  kind: 'ranking';
  /** Points du 1er, 2e, 3e… Les places non renseignées valent 0. */
  points: number[];
}

/** Salade : on rejoue plusieurs contrats en même temps. */
export interface CompositeContract extends BaseContract {
  kind: 'composite';
  parts: string[];
  multiplier: number;
}

export type Contract = PerItemContract | SlotsContract | RankingContract | CompositeContract;
export type SimpleContract = PerItemContract | SlotsContract | RankingContract;

export interface RuleSet {
  id: string;
  name: string;
  contracts: Contract[];
  /** Les règles livrées avec l'app ne se modifient pas directement (on les duplique). */
  builtIn?: boolean;
}

/**
 * Saisie d'un contrat simple :
 * - perItem : nombre d'éléments par joueur
 * - slots   : index du joueur pour chaque slot (null = pas encore choisi)
 * - ranking : index des joueurs dans l'ordre d'arrivée
 */
export type PartInput = (number | null)[];

export interface Round {
  id: string;
  dealer: number;
  contractId: string;
  /** clé = id du contrat simple (pour une salade : un input par partie). */
  inputs: Record<string, PartInput>;
}

export interface Game {
  id: string;
  createdAt: number;
  players: string[];
  deck: DeckSize;
  rules: RuleSet;
  firstDealer: number;
  rounds: Round[];
}
