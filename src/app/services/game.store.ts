import { computed, effect } from '@angular/core';
import {
  getState,
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { DASHES_FOR_PENALTY, PENALTY_POINTS } from '../constants/game.constants';
import { GameState, INITIAL_GAME_STATE, Player, Team } from '../models/game.models';
import { INITIAL_APPLICATION_STATE } from '../models/app.models';
import { withDevtools } from '../utils/with-devtools';

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'dice_game_state';

function loadFromStorage(): GameState {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return INITIAL_GAME_STATE;
  // Merge with INITIAL_GAME_STATE so that new fields get default values when
  // loading persisted state that predates those fields.
  return { ...INITIAL_GAME_STATE, ...(JSON.parse(stored) as Partial<GameState>) };
}

// ---------------------------------------------------------------------------
// Pure helper functions (no side-effects, easy to unit-test independently)
// ---------------------------------------------------------------------------

function getTeamIndexForPlayer(teams: Team[], playerId: string): number {
  return teams.findIndex(t => t.playerIds.includes(playerId));
}

function updateTeamsPlayerOrder(teams: Team[], orderedPlayers: Player[]): Team[] {
  return teams.map(team => ({
    ...team,
    playerIds: [...team.playerIds].sort((a, b) => {
      const indexA = orderedPlayers.findIndex(p => p.id === a);
      const indexB = orderedPlayers.findIndex(p => p.id === b);
      return indexA - indexB;
    }),
  }));
}

function calcIndividualPoints(s: GameState, points: number): Partial<GameState> {
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
  const winnerTeamPlayerCount = s.winnerTeamPlayerCount;

  if (player.score >= s.targetPoints && !lastRoundStarted) {
    lastRoundStarted = true;
    firstToReachTargetId = player.id;
  }

  const nextPlayerIndex = (s.currentPlayerIndex + 1) % players.length;

  // If last round was started and we are back to the first player, game is over
  if (lastRoundStarted && nextPlayerIndex === 0) {
    isGameOver = true;

    const playersWithTarget = players.filter(p => p.score >= s.targetPoints);
    const maxScore = Math.max(...playersWithTarget.map(p => p.score), 0);
    const playersWithMaxScore = playersWithTarget.filter(p => p.score === maxScore);
    const firstToReach = playersWithMaxScore.find(p => p.id === firstToReachTargetId);

    winnerId = firstToReach ? firstToReach.id : (playersWithMaxScore[0]?.id || null);
    winnerType = 'player';
  }

  return {
    players,
    currentPlayerIndex: nextPlayerIndex,
    isGameOver,
    winnerId,
    winnerType,
    lastRoundStarted,
    firstToReachTargetId,
    winnerTeamPlayerCount,
  };
}

function calcTeamPoints(s: GameState, points: number): Partial<GameState> {
  const teams = [...s.teams];
  const team = { ...teams[s.currentTeamIndex] };
  const players = [...s.players];
  const player = { ...players[s.currentPlayerIndex] };

  player.history = [...player.history, points];

  if (points === 0) {
    team.dashes++;
  } else {
    team.dashes = 0;
    team.score += points;
  }

  if (team.dashes === DASHES_FOR_PENALTY) {
    team.score -= PENALTY_POINTS;
    team.dashes = 0;
  }

  players[s.currentPlayerIndex] = player;
  teams[s.currentTeamIndex] = team;

  let isGameOver = s.isGameOver;
  let winnerId = s.winnerId;
  let winnerType = s.winnerType;
  let lastRoundStarted = s.lastRoundStarted;
  let firstToReachTargetId = s.firstToReachTargetId;
  let winnerTeamPlayerCount = s.winnerTeamPlayerCount;

  if (team.score >= s.targetPoints && !lastRoundStarted) {
    lastRoundStarted = true;
    firstToReachTargetId = team.id;
    // How many players of this team have already played in this round (including current)
    const firstPlayerOfTeamIndex = s.players.findIndex(p => team.playerIds.includes(p.id));
    winnerTeamPlayerCount = s.currentPlayerIndex - firstPlayerOfTeamIndex + 1;
  }

  // Rule: other teams get the same number of player-turns as the winning team used
  let nextPlayerIndex = (s.currentPlayerIndex + 1) % players.length;

  if (lastRoundStarted) {
    const winnerTeam = teams.find(t => t.id === firstToReachTargetId);
    if (winnerTeam) {
      const firstOfWinnerIdx = s.players.findIndex(p => winnerTeam.playerIds.includes(p.id));
      const lastOfWinnerIdx = firstOfWinnerIdx + (winnerTeamPlayerCount ?? 0) - 1;

      if (s.currentPlayerIndex === lastOfWinnerIdx) {
        // Skip remaining winner-team players; jump to first player of next team
        const nextTeamIdx = (s.currentTeamIndex + 1) % teams.length;
        nextPlayerIndex =
          nextTeamIdx === 0
            ? 0
            : s.players.findIndex(p => teams[nextTeamIdx].playerIds.includes(p.id));
      } else {
        // Check if current team has used up its quota
        const firstOfCurrentTeamIdx = s.players.findIndex(p => team.playerIds.includes(p.id));
        const playedInTeam = s.currentPlayerIndex - firstOfCurrentTeamIdx + 1;
        if (playedInTeam === winnerTeamPlayerCount) {
          const nextTeamIdx = (s.currentTeamIndex + 1) % teams.length;
          if (nextTeamIdx === 0) {
            isGameOver = true;
          } else {
            nextPlayerIndex = s.players.findIndex(p => teams[nextTeamIdx].playerIds.includes(p.id));
          }
        }
      }
    }
  }

  if (isGameOver || (lastRoundStarted && nextPlayerIndex === 0)) {
    isGameOver = true;

    const teamsWithTarget = teams.filter(t => t.score >= s.targetPoints);
    const maxScore = Math.max(...teamsWithTarget.map(t => t.score), 0);
    const teamsWithMaxScore = teamsWithTarget.filter(t => t.score === maxScore);
    const firstToReach = teamsWithMaxScore.find(t => t.id === firstToReachTargetId);

    winnerId = firstToReach ? firstToReach.id : (teamsWithMaxScore[0]?.id || null);
    winnerType = 'team';
  }

  const nextPlayer = players[nextPlayerIndex];
  const nextTeamIndex = teams.findIndex(t => t.playerIds.includes(nextPlayer.id));

  return {
    players,
    teams,
    currentPlayerIndex: nextPlayerIndex,
    currentTeamIndex: nextTeamIndex,
    isGameOver,
    winnerId,
    winnerType,
    lastRoundStarted,
    firstToReachTargetId,
    winnerTeamPlayerCount,
  };
}

// ---------------------------------------------------------------------------
// Signal Store
// ---------------------------------------------------------------------------

export const GameStore = signalStore(
  { providedIn: 'root' },

  // Game domain state — loaded from / persisted to localStorage
  // Factory function ensures loadFromStorage() is called fresh per instance (important for tests)
  withState<GameState>(() => loadFromStorage()),

  // Application-level state — never persisted; resets with each page session.
  // Nested under `applicationState` so it appears as a distinct group in Redux DevTools.
  withState(() => ({ applicationState: { ...INITIAL_APPLICATION_STATE } })),

  withComputed((store) => ({
    currentPlayer: computed<Player | null>(() => store.players()[store.currentPlayerIndex()] ?? null),
    currentTeam: computed<Team | null>(() => store.teams()[store.currentTeamIndex()] ?? null),

    // Backwards-compatible full-state accessor used by components and existing tests
    state: computed<GameState>(() => ({
      gameMode: store.gameMode(),
      targetPoints: store.targetPoints(),
      minPointsPerTurn: store.minPointsPerTurn(),
      players: store.players(),
      teams: store.teams(),
      currentPlayerIndex: store.currentPlayerIndex(),
      currentTeamIndex: store.currentTeamIndex(),
      isStarted: store.isStarted(),
      isGameOver: store.isGameOver(),
      winnerId: store.winnerId(),
      winnerType: store.winnerType(),
      lastRoundStarted: store.lastRoundStarted(),
      firstToReachTargetId: store.firstToReachTargetId(),
      winnerTeamPlayerCount: store.winnerTeamPlayerCount(),
    })),
  })),

  withMethods((store) => ({
    setupGame(config: Partial<GameState>): void {
      const s = getState(store);
      const merged = { ...s, ...config };

      let teams = merged.teams;
      if (merged.gameMode === 'team' && merged.players.length > 0) {
        teams = updateTeamsPlayerOrder(merged.teams, merged.players);
      }

      patchState(store, {
        ...merged,
        teams,
        currentPlayerIndex: 0,
        currentTeamIndex:
          merged.gameMode === 'team' && merged.players.length > 0
            ? getTeamIndexForPlayer(teams, merged.players[0].id)
            : 0,
        isStarted: true,
        isGameOver: false,
        winnerId: null,
        winnerType: null,
        lastRoundStarted: false,
        firstToReachTargetId: null,
        winnerTeamPlayerCount: null,
      });
    },

    addPoints(points: number): void {
      const s = getState(store);
      if (s.isGameOver) return;

      // Points below minimum count as zero (dash)
      const effectivePoints = points > 0 && points < s.minPointsPerTurn ? 0 : points;
      patchState(
        store,
        s.gameMode === 'individual'
          ? calcIndividualPoints(s, effectivePoints)
          : calcTeamPoints(s, effectivePoints),
      );
    },

    resetGame(keepPlayers: boolean): void {
      const nextResetId = store.applicationState().resetId + 1;
      if (keepPlayers) {
        const s = getState(store);
        patchState(store, {
          ...INITIAL_GAME_STATE,
          gameMode: s.gameMode,
          targetPoints: s.targetPoints,
          minPointsPerTurn: s.minPointsPerTurn,
          players: s.players.map(p => ({ ...p, score: 0, dashes: 0, history: [] })),
          teams: s.teams.map(t => ({ ...t, score: 0, dashes: 0, history: [] })),
          lastRoundStarted: false,
          firstToReachTargetId: null,
          winnerTeamPlayerCount: null,
          applicationState: { resetId: nextResetId },
        });
      } else {
        patchState(store, { ...INITIAL_GAME_STATE, applicationState: { resetId: nextResetId } });
      }
    },

    reorderPlayers(players: Player[]): void {
      const s = getState(store);
      const teams = s.gameMode === 'team' ? updateTeamsPlayerOrder(s.teams, players) : s.teams;
      patchState(store, {
        players: [...players],
        teams,
        currentPlayerIndex: 0,
        currentTeamIndex: s.gameMode === 'team' ? getTeamIndexForPlayer(teams, players[0].id) : 0,
      });
    },

    setStartingPlayer(playerId: string): void {
      const s = getState(store);
      const playerIndex = s.players.findIndex(p => p.id === playerId);
      if (playerIndex === -1) return;

      // Shift array so chosen player becomes index 0
      const newPlayers = [...s.players.slice(playerIndex), ...s.players.slice(0, playerIndex)];
      const teams = s.gameMode === 'team' ? updateTeamsPlayerOrder(s.teams, newPlayers) : s.teams;

      patchState(store, {
        players: newPlayers,
        teams,
        currentPlayerIndex: 0,
        currentTeamIndex: s.gameMode === 'team' ? getTeamIndexForPlayer(teams, newPlayers[0].id) : 0,
      });
    },

    setConfig(config: { gameMode: GameState['gameMode']; targetPoints: number; minPointsPerTurn: number }): void {
      patchState(store, {
        gameMode: config.gameMode,
        targetPoints: config.targetPoints,
        minPointsPerTurn: config.minPointsPerTurn,
      });
    },

    updatePlayersAndTeams(players: Player[], teams: Team[]): void {
      const s = getState(store);
      patchState(store, {
        players: [...players],
        teams: [...teams],
        // Reset current player/team indices if needed, but for management during setup it might be enough to just update the lists
        // If we are in the middle of a game, this might be tricky, but the component is accessed from Player Ordering.
        currentPlayerIndex: 0,
        currentTeamIndex: s.gameMode === 'team' && players.length > 0 ? getTeamIndexForPlayer(teams, players[0].id) : 0,
      });
    },
  })),

  withHooks({
    onInit(store) {
      // Persist only game state to localStorage — application state is intentionally excluded
      effect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store.state()));
      });
    },
  }),

  // Connect to the Redux DevTools browser extension (dev mode only)
  withDevtools('GameStore'),
);
