export type GameMode = 'individual' | 'team';

export interface Player {
  id: string;
  name: string;
  score: number;
  dashes: number; // consecutive zeros
  history: number[];
}

export interface Team {
  id: string;
  name: string;
  playerIds: string[];
  score: number;
  dashes: number; // team dashes logic: three consecutive players in a row on the same team roll 0 points
  history: number[];
}

export interface GameState {
  gameMode: GameMode;
  targetPoints: number;
  players: Player[];
  teams: Team[];
  currentPlayerIndex: number;
  currentTeamIndex: number;
  isStarted: boolean;
  isGameOver: boolean;
  winnerId: string | null;
  winnerType: 'player' | 'team' | null;
}

export const INITIAL_GAME_STATE: GameState = {
  gameMode: 'individual',
  targetPoints: 10000,
  players: [],
  teams: [],
  currentPlayerIndex: 0,
  currentTeamIndex: 0,
  isStarted: false,
  isGameOver: false,
  winnerId: null,
  winnerType: null,
};
