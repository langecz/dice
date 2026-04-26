import { Injectable, signal, computed, effect } from '@angular/core';
import { GameState, INITIAL_GAME_STATE, Player, Team} from '../models/game.models';
import { DASHES_FOR_PENALTY, PENALTY_POINTS } from '../constants/game.constants';

@Injectable({
  providedIn: 'root'
})
export class GameStore {
  private readonly STORAGE_KEY = 'dice_game_state';

  // State signal
  private stateSignal = signal<GameState>(this.loadFromStorage());

  // Selectors
  readonly state = this.stateSignal.asReadonly();
  readonly players = computed(() => this.stateSignal().players);
  readonly teams = computed(() => this.stateSignal().teams);
  readonly gameMode = computed(() => this.stateSignal().gameMode);
  readonly isGameOver = computed(() => this.stateSignal().isGameOver);
  readonly currentPlayer = computed<Player | null>(() => {
    const s = this.stateSignal();
    return s.players[s.currentPlayerIndex] || null;
  });
  readonly currentTeam = computed<Team | null>(() => {
    const s = this.stateSignal();
    return s.teams[s.currentTeamIndex] || null;
  });

  constructor() {
    // Persistence effect
    effect(() => {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.stateSignal()));
    });
  }

  // Actions
  setupGame(config: Partial<GameState>) {
    this.stateSignal.update(s => ({
      ...s,
      ...config,
      currentPlayerIndex: 0,
      currentTeamIndex: 0,
      isStarted: true,
      isGameOver: false,
      winnerId: null,
      winnerType: null,
      lastRoundStarted: false,
      firstToReachTargetId: null
    }));
  }

  addPoints(points: number) {
    const gameState = this.stateSignal();
    if (gameState.isGameOver) return;

    if (points > 0 && points < gameState.minPointsPerTurn) {
      points = 0;
    }

    if (gameState.gameMode === 'individual') {
      this.recordIndividualPoints(points);
    } else {
      this.recordTeamPoints(points);
    }
  }

  private recordIndividualPoints(points: number) {
    this.stateSignal.update(s => {
      const players = [...s.players];
      const player = { ...players[s.currentPlayerIndex] };

      player.history = [...player.history, points];

      if (points === 0) {
        player.dashes++;
      } else {
        player.dashes = 0;
        player.score += points;
      }

      if (player.dashes === DASHES_FOR_PENALTY) {
        player.score -= PENALTY_POINTS;
        player.dashes = 0;
      }

      players[s.currentPlayerIndex] = player;

      let isGameOver = s.isGameOver;
      let winnerId = s.winnerId;
      let winnerType = s.winnerType;
      let lastRoundStarted = s.lastRoundStarted;
      let firstToReachTargetId = s.firstToReachTargetId;

      if (player.score >= s.targetPoints && !lastRoundStarted) {
        lastRoundStarted = true;
        firstToReachTargetId = player.id;
      }

      const nextPlayerIndex = (s.currentPlayerIndex + 1) % players.length;

      // If last round was started, and we are back to the first player (index 0), then game is over
      if (lastRoundStarted && nextPlayerIndex === 0) {
        isGameOver = true;

        // Find the player with the highest score among those who reached targetPoints.
        // If there's a tie, the one who reached it first (firstToReachTargetId) wins.
        const playersWithTarget = players.filter(p => p.score >= s.targetPoints);
        const maxScore = Math.max(...playersWithTarget.map(p => p.score));
        const playersWithMaxScore = playersWithTarget.filter(p => p.score === maxScore);

        const firstToReach = playersWithMaxScore.find(p => p.id === firstToReachTargetId);
        if (firstToReach) {
          winnerId = firstToReach.id;
        } else {
          winnerId = playersWithMaxScore[0].id;
        }

        winnerType = 'player';
      }

      return {
        ...s,
        players,
        currentPlayerIndex: nextPlayerIndex,
        isGameOver,
        winnerId,
        winnerType,
        lastRoundStarted,
        firstToReachTargetId
      };
    });
  }

  private recordTeamPoints(points: number) {
    this.stateSignal.update(s => {
      const teams = [...s.teams];
      const team = { ...teams[s.currentTeamIndex] };
      const players = [...s.players];

      // We need to find the current player in the team.
      // In team mode, players of the same team roll in sequence?
      // Requirement 8: "In team play, 500 points are deducted if three players in a row on the same team roll 0 points."
      // Requirement 5: "Each player rolls the dice"

      // Let's assume turn rotates through teams, and within each team it rotates through players.
      // OR turn rotates through all players, but we track team scores.

      const playerIndex = s.currentPlayerIndex;
      const player = { ...players[playerIndex] };

      player.history = [...player.history, points];

      if (points === 0) {
        team.dashes++;
      } else {
        team.dashes = 0;
        team.score += points;
      }

      if (team.dashes === DASHES_FOR_PENALTY) {
        // Team penalty: 3 players in a row roll 0
        team.score -= PENALTY_POINTS;
        team.dashes = 0;
      }

      players[playerIndex] = player;
      teams[s.currentTeamIndex] = team;

      let isGameOver = s.isGameOver;
      let winnerId = s.winnerId;
      let winnerType = s.winnerType;
      let lastRoundStarted = s.lastRoundStarted;
      let firstToReachTargetId = s.firstToReachTargetId;

      if (team.score >= s.targetPoints && !lastRoundStarted) {
        lastRoundStarted = true;
        firstToReachTargetId = team.id;
      }

      // Next player/team logic:
      // Typically in these games, all players of Team A go, then all of Team B?
      // OR Player 1 of Team A, Player 1 of Team B, Player 2 of Team A...
      // Let's go with: Player 1 Team A -> Player 2 Team A -> ... -> Player N Team A -> Player 1 Team B ...

      let nextPlayerIndex = (s.currentPlayerIndex + 1) % players.length;

      if (lastRoundStarted && nextPlayerIndex === 0) {
        isGameOver = true;

        // Find the team with the highest score among those who reached targetPoints.
        // If there's a tie, the one who reached it first (firstToReachTargetId) wins.
        const teamsWithTarget = teams.filter(t => t.score >= s.targetPoints);
        const maxScore = Math.max(...teamsWithTarget.map(t => t.score));
        const teamsWithMaxScore = teamsWithTarget.filter(t => t.score === maxScore);

        const firstToReach = teamsWithMaxScore.find(t => t.id === firstToReachTargetId);
        if (firstToReach) {
          winnerId = firstToReach.id;
        } else {
          winnerId = teamsWithMaxScore[0].id;
        }

        winnerType = 'team';
      }

      // Update currentTeamIndex based on nextPlayerIndex
      const nextPlayer = players[nextPlayerIndex];
      const nextTeamIndex = teams.findIndex(t => t.playerIds.includes(nextPlayer.id));

      return {
        ...s,
        players,
        teams,
        currentPlayerIndex: nextPlayerIndex,
        currentTeamIndex: nextTeamIndex,
        isGameOver,
        winnerId,
        winnerType,
        lastRoundStarted,
        firstToReachTargetId
      };
    });
  }

  resetGame(keepPlayers: boolean) {
    if (keepPlayers) {
      this.stateSignal.update(s => ({
        ...INITIAL_GAME_STATE,
        gameMode: s.gameMode,
        targetPoints: s.targetPoints,
        minPointsPerTurn: s.minPointsPerTurn,
        players: s.players.map(p => ({ ...p, score: 0, dashes: 0, history: [] })),
        teams: s.teams.map(t => ({ ...t, score: 0, dashes: 0, history: [] })),
        lastRoundStarted: false,
        firstToReachTargetId: null,
      }));
    } else {
      this.stateSignal.set(INITIAL_GAME_STATE);
    }
  }

  reorderPlayers(players: Player[]) {
    this.stateSignal.update(s => {
      // Update team playerIds order if in team mode
      const teams = s.gameMode === 'team' ? this.updateTeamsPlayerOrder(s.teams, players) : s.teams;

      return {
        ...s,
        players: [...players],
        teams,
        currentPlayerIndex: 0,
        currentTeamIndex: s.gameMode === 'team' ? this.getTeamIndexForPlayer(teams, players[0].id) : 0
      };
    });
  }

  setStartingPlayer(playerId: string) {
    this.stateSignal.update(s => {
      const players = [...s.players];
      const playerIndex = players.findIndex(p => p.id === playerId);
      if (playerIndex === -1) return s;

      // Shift players: chosen player becomes first
      const newPlayers = [
        ...players.slice(playerIndex),
        ...players.slice(0, playerIndex)
      ];

      const teams = s.gameMode === 'team' ? this.updateTeamsPlayerOrder(s.teams, newPlayers) : s.teams;

      return {
        ...s,
        players: newPlayers,
        teams,
        currentPlayerIndex: 0,
        currentTeamIndex: s.gameMode === 'team' ? this.getTeamIndexForPlayer(teams, newPlayers[0].id) : 0
      };
    });
  }

  private updateTeamsPlayerOrder(teams: Team[], orderedPlayers: Player[]): Team[] {
    // In this game, players of the same team roll in sequence?
    // Wait, let me check recordTeamPoints logic again.
    // It seems it just follows the players array order.
    return teams.map(team => ({
      ...team,
      playerIds: team.playerIds.sort((a, b) => {
        const indexA = orderedPlayers.findIndex(p => p.id === a);
        const indexB = orderedPlayers.findIndex(p => p.id === b);
        return indexA - indexB;
      })
    }));
  }

  private getTeamIndexForPlayer(teams: Team[], playerId: string): number {
    return teams.findIndex(t => t.playerIds.includes(playerId));
  }

  private loadFromStorage(): GameState {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : INITIAL_GAME_STATE;
  }
}
