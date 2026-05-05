import { DEFAULT_MIN_POINTS_PER_TURN, DEFAULT_TARGET_POINTS } from '../constants/game.constants';

export type GameMode = 'individual' | 'team';

export interface Player {
  id: string;
  name: string;
  score: number;
  dashes: number; // consecutive zeros
  history: number[];
  wins: number;
}

export interface Team {
  id: string;
  name: string;
  playerIds: string[];
  score: number;
  dashes: number; // team dashes logic: three consecutive players in a row on the same team roll 0 points
  history: number[];
  wins: number;
}

export interface PlayerTurnRecord {
  playerId: string;
  playerName: string;
  points: number | '-';
}

export interface RoundRecord {
  roundNumber: number;
  turns: PlayerTurnRecord[];
}

export interface GameRecord {
  id: string;
  timestamp: number;
  winnerName: string;
  finalScores: string; // e.g. "A: 1, B: 1" as requested in requirements
  rounds: RoundRecord[];
}

export interface GameState {
  gameMode: GameMode;
  targetPoints: number;
  minPointsPerTurn: number;
  players: Player[];
  teams: Team[];
  currentPlayerIndex: number;
  currentTeamIndex: number;
  isStarted: boolean;
  isGameOver: boolean;
  winnerId: string | null;
  winnerType: 'player' | 'team' | null;
  lastRoundStarted: boolean;
  firstToReachTargetId: string | null;
  winnerTeamPlayerCount: number | null;
  gameHistory: GameRecord[];
  currentRound: PlayerTurnRecord[];
  currentGame: RoundRecord[];
  currentRoundNumber: number;
}

export const INITIAL_GAME_STATE: GameState = {
  gameMode: 'individual',
  targetPoints: DEFAULT_TARGET_POINTS,
  minPointsPerTurn: DEFAULT_MIN_POINTS_PER_TURN,
  players: [],
  teams: [],
  currentPlayerIndex: 0,
  currentTeamIndex: 0,
  isStarted: false,
  isGameOver: false,
  winnerId: null,
  winnerType: null,
  lastRoundStarted: false,
  firstToReachTargetId: null,
  winnerTeamPlayerCount: null,
  gameHistory: [],
  currentRound: [],
  currentGame: [],
  currentRoundNumber: 1,
}
