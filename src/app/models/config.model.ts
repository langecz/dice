import { GameMode } from './game.models';

export interface GameConfig {
  gameMode: GameMode;
  targetPoints: number;
  minPointsPerTurn: number
}
