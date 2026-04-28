import { TestBed } from '@angular/core/testing';
import { GameStore } from './game.store';
import { DEFAULT_TARGET_POINTS } from '../constants/game.constants';

describe('GameStore', () => {
  let store: InstanceType<typeof GameStore>;

  beforeEach(() => {
    // Clear localStorage to ensure a clean state
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [GameStore]
    });
    store = TestBed.inject(GameStore);
  });

  /**
   * Test if the GameStore is successfully initialized by Angular's DI.
   */
  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  /**
   * Test if the GameStore starts with the expected initial default values.
   */
  it('should have initial state', () => {
    const state = store.state();
    expect(state.isStarted).toBe(false);
    expect(state.players.length).toBe(0);
    expect(state.teams.length).toBe(0);
    expect(state.targetPoints).toBe(DEFAULT_TARGET_POINTS);
  });

  /**
   * Tests for the setupGame method which initializes the game with specific configurations.
   */
  describe('setupGame', () => {
    /**
     * Test initializing a game in individual mode.
     */
    it('should setup individual game', () => {
      const players = [
        { id: '1', name: 'Player 1', score: 0, dashes: 0, history: [] },
        { id: '2', name: 'Player 2', score: 0, dashes: 0, history: [] }
      ];
      store.setupGame({
        gameMode: 'individual',
        targetPoints: 5000,
        minPointsPerTurn: 300,
        players,
        teams: []
      });

      const state = store.state();
      expect(state.gameMode).toBe('individual');
      expect(state.targetPoints).toBe(5000);
      expect(state.minPointsPerTurn).toBe(300);
      expect(state.players.length).toBe(2);
      expect(state.isStarted).toBe(true);
    });

    /**
     * Test initializing a game in team mode.
     */
    it('should setup team game', () => {
      const players = [
        { id: '1', name: 'P1', score: 0, dashes: 0, history: [] },
        { id: '2', name: 'P2', score: 0, dashes: 0, history: [] }
      ];
      const teams = [
        { id: 't1', name: 'Team 1', playerIds: ['1', '2'], score: 0, dashes: 0, history: [] }
      ];
      store.setupGame({
        gameMode: 'team',
        targetPoints: 10000,
        minPointsPerTurn: 350,
        players,
        teams
      });

      const state = store.state();
      expect(state.gameMode).toBe('team');
      expect(state.teams.length).toBe(1);
      expect(state.teams[0].playerIds).toEqual(['1', '2']);
    });
  });

  /**
   * Tests for scoring and game logic in individual mode.
   */
  describe('Point Calculation - Individual Mode', () => {
    beforeEach(() => {
      store.setupGame({
        gameMode: 'individual',
        targetPoints: 1000,
        minPointsPerTurn: 350,
        players: [
          { id: '1', name: 'P1', score: 0, dashes: 0, history: [] },
          { id: '2', name: 'P2', score: 0, dashes: 0, history: [] }
        ],
        teams: []
      });
    });

    /**
     * Test adding valid points to a player's score.
     */
    it('should add points correctly', () => {
      store.addPoints(400);
      expect(store.state().players[0].score).toBe(400);
      expect(store.state().currentPlayerIndex).toBe(1);
    });

    /**
     * Test that points below the minimum threshold are ignored and count as a dash (zero roll).
     */
    it('should treat points below minimum as 0 (and increment dashes)', () => {
      store.addPoints(300); // Less than 350
      expect(store.state().players[0].score).toBe(0);
      expect(store.state().players[0].dashes).toBe(1);
      expect(store.state().currentPlayerIndex).toBe(1);
    });

    /**
     * Test that the dash counter resets to zero when a player records positive points.
     */
    it('should reset dashes when points > 0 are added', () => {
      store.addPoints(0);
      expect(store.state().players[0].dashes).toBe(1);

      store.addPoints(400); // P2's turn
      store.addPoints(400); // P1's turn
      expect(store.state().players[0].dashes).toBe(0);
      expect(store.state().players[0].score).toBe(400);
    });

    /**
     * Test that a point penalty is applied after a player rolls three consecutive zeros (dashes).
     */
    it('should apply penalty after 3 dashes', () => {
      // Set high target to avoid early game over
      store.setupGame({
        gameMode: 'individual',
        targetPoints: 10000,
        minPointsPerTurn: 350,
        players: [
          { id: '1', name: 'P1', score: 0, dashes: 0, history: [] },
          { id: '2', name: 'P2', score: 0, dashes: 0, history: [] }
        ],
        teams: []
      });

      // P1 score 600
      store.addPoints(600);
      // P2 skip
      store.addPoints(400);

      // P1 dashes: 1
      store.addPoints(0);
      // P2 skip
      store.addPoints(400);
      // P1 dashes: 2
      store.addPoints(0);
      // P2 skip
      store.addPoints(400);
      // P1 dashes: 3 -> Penalty!
      store.addPoints(0);

      const p1 = store.state().players[0];
      // Expected score: 600 - 500 = 100
      expect(p1.score).toBe(100);
      expect(p1.dashes).toBe(0);
    });

    /**
     * Test that reaching the target points triggers the "last round" flag, allowing other players to finish their turn.
     */
    it('should start last round when player reaches targetPoints', () => {
      store.addPoints(1000);
      const state = store.state();
      expect(state.lastRoundStarted).toBe(true);
      expect(state.firstToReachTargetId).toBe('1');
      expect(state.isGameOver).toBe(false);
      expect(state.currentPlayerIndex).toBe(1);
    });

    /**
     * Test that the game officially ends once everyone has completed their turn in the final round.
     */
    it('should end game when round finishes after target reached', () => {
      store.addPoints(1000); // P1 reaches target
      store.addPoints(400);  // P2 finishes their turn

      const state = store.state();
      expect(state.isGameOver).toBe(true);
      expect(state.winnerId).toBe('1');
      expect(state.winnerType).toBe('player');
    });

    /**
     * Test that the first person to reach the target remains the winner, if they have the highest score at the end.
     */
    it('should keep the first player who reached target as winner if they have highest score', () => {
      store.addPoints(1100); // P1 reaches target
      store.addPoints(1000); // P2 also reaches target in the same round, but P1 is higher

      const state = store.state();
      expect(state.isGameOver).toBe(true);
      expect(state.winnerId).toBe('1');
    });

    /**
     * Test that if player B reaches MORE points than player A (who reached target first), player B wins.
     */
    it('should set player B as winner if they reach more points than player A in the last round', () => {
      store.addPoints(1000); // P1 reaches target
      store.addPoints(1100); // P2 reaches target with MORE points

      const state = store.state();
      expect(state.isGameOver).toBe(true);
      expect(state.winnerId).toBe('2');
    });

    /**
     * Test that if both reach the SAME points, the first one who reached it wins.
     */
    it('should keep player A as winner if both reach the same points in the last round', () => {
      store.addPoints(1000); // P1 reaches target
      store.addPoints(1000); // P2 reaches target with SAME points

      const state = store.state();
      expect(state.isGameOver).toBe(true);
      expect(state.winnerId).toBe('1');
    });

    /**
     * Test for the reported bug: when player A reaches TARGET_POINTS points, the last round starts.
     * Then player B reaches also TARGET_POINTS points. A should be the winner.
     * But if B reaches TARGET_POINTS + n, B should be the winner.
     */
    it('should correctly handle winner when multiple players reach target points', () => {
      // Setup with TARGET_POINTS from constants if possible, but here we used 1000 in beforeEach
      store.addPoints(1000); // P1 (A) reaches 1000
      store.addPoints(1000); // P2 (B) reaches 1000
      expect(store.state().winnerId).toBe('1'); // A reached it first, same points -> A wins

      store.resetGame(true);
      store.setupGame({
        gameMode: 'individual',
        targetPoints: 1000,
        minPointsPerTurn: 350,
        players: [
          { id: '1', name: 'P1', score: 0, dashes: 0, history: [] },
          { id: '2', name: 'P2', score: 0, dashes: 0, history: [] }
        ],
        teams: []
      });

      store.addPoints(1000); // P1 (A) reaches 1000
      store.addPoints(1100); // P2 (B) reaches 1100
      expect(store.state().winnerId).toBe('2'); // B reached more points -> B wins
    });
  });

  /**
   * Tests for scoring and game logic in team mode.
   */
  describe('Point Calculation - Team Mode', () => {
    beforeEach(() => {
      const players = [
        { id: '1', name: 'P1', score: 0, dashes: 0, history: [] },
        { id: '2', name: 'P2', score: 0, dashes: 0, history: [] },
        { id: '3', name: 'P3', score: 0, dashes: 0, history: [] },
        { id: '4', name: 'P4', score: 0, dashes: 0, history: [] }
      ];
      const teams = [
        { id: 't1', name: 'Team 1', playerIds: ['1', '2'], score: 0, dashes: 0, history: [] },
        { id: 't2', name: 'Team 2', playerIds: ['3', '4'], score: 0, dashes: 0, history: [] }
      ];
      store.setupGame({
        gameMode: 'team',
        targetPoints: 1000,
        minPointsPerTurn: 350,
        players,
        teams
      });
    });

    /**
     * Test that points are added to the team's total score instead of individual player scores.
     */
    it('should add points to team score', () => {
      store.addPoints(400); // P1 turn
      expect(store.state().teams[0].score).toBe(400);
      expect(store.state().currentPlayerIndex).toBe(1); // Next is P2
      expect(store.state().currentTeamIndex).toBe(0); // Still Team 1
    });

    /**
     * Test that a team penalty is applied when team members collectively roll three consecutive zeros.
     */
    it('should apply team penalty after 3 consecutive zero-point turns from team members', () => {
      // Set high target to avoid early game over
      const players = [
        { id: '1', name: 'P1', score: 0, dashes: 0, history: [] },
        { id: '2', name: 'P2', score: 0, dashes: 0, history: [] },
        { id: '3', name: 'P3', score: 0, dashes: 0, history: [] },
        { id: '4', name: 'P4', score: 0, dashes: 0, history: [] }
      ];
      const teams = [
        { id: 't1', name: 'Team 1', playerIds: ['1', '2'], score: 0, dashes: 0, history: [] },
        { id: 't2', name: 'Team 2', playerIds: ['3', '4'], score: 0, dashes: 0, history: [] }
      ];
      store.setupGame({
        gameMode: 'team',
        targetPoints: 10000,
        minPointsPerTurn: 350,
        players,
        teams
      });

      // P1 score 600
      store.addPoints(600); // P1 (Team 1) -> Score 600, Dash 0, next P2 (Team 1)
      store.addPoints(0);   // P2 (Team 1) -> Score 600, Dash 1, next P3 (Team 2)
      store.addPoints(0);   // P3 (Team 2) -> Team 2 Score 0, Dash 1, next P4 (Team 2)
      store.addPoints(0);   // P4 (Team 2) -> Team 2 Score 0, Dash 2, next P1 (Team 1)
      store.addPoints(0);   // P1 (Team 1) -> Team 1 Score 600, Dash 2, next P2 (Team 1)
      store.addPoints(0);   // P2 (Team 1) -> Team 1 Score 600 - 500 = 100, Dash 0, next P3 (Team 2)

      const team1 = store.state().teams[0];
      expect(team1.score).toBe(100);
      expect(team1.dashes).toBe(0);
    });

    /**
     * Test that the final round starts when a team's total score reaches the target.
     */
    it('should start last round when team reaches targetPoints', () => {
      store.addPoints(1000); // P1
      const state = store.state();
      expect(state.lastRoundStarted).toBe(true);
      expect(state.firstToReachTargetId).toBe('t1');
      expect(state.isGameOver).toBe(false);
    });

    /**
     * Test that the game ends after all players have completed the final round in team mode.
     */
    it('should end game when all players have finished the round', () => {
      store.addPoints(1000); // P1 (Team 1) - Target reached
      store.addPoints(0);    // P2 (Team 1)
      store.addPoints(0);    // P3 (Team 2)
      store.addPoints(0);    // P4 (Team 2)

      const state = store.state();
      expect(state.isGameOver).toBe(true);
      expect(state.winnerId).toBe('t1');
    });

    /**
     * Test the specific requirement:
     * In the case of team play, the game finishes when the same count of players as in winner teams finishes his round.
     * Example: Team A (A1, A2, A3), Team B (B1, B2, B3).
     * A2 reaches TARGET_POINTS. A3 does not play.
     * Game ends when B1 and B2 finish their turns. B3 does not play.
     */
    it('should finish the game when the same count of players as in winner team finishes their turn (3-player teams)', () => {
      const players = [
        { id: 'A1', name: 'A1', score: 0, dashes: 0, history: [] },
        { id: 'A2', name: 'A2', score: 0, dashes: 0, history: [] },
        { id: 'A3', name: 'A3', score: 0, dashes: 0, history: [] },
        { id: 'B1', name: 'B1', score: 0, dashes: 0, history: [] },
        { id: 'B2', name: 'B2', score: 0, dashes: 0, history: [] },
        { id: 'B3', name: 'B3', score: 0, dashes: 0, history: [] }
      ];
      const teams = [
        { id: 'TA', name: 'Team A', playerIds: ['A1', 'A2', 'A3'], score: 0, dashes: 0, history: [] },
        { id: 'TB', name: 'Team B', playerIds: ['B1', 'B2', 'B3'], score: 0, dashes: 0, history: [] }
      ];

      store.setupGame({
        gameMode: 'team',
        targetPoints: 1000,
        minPointsPerTurn: 350,
        players,
        teams
      });

      // Round 1: Everyone plays 0 (using points that are below minimum but trigger turn change)
      // Actually addPoints(0) always works if minPointsPerTurn is handled.
      // Wait, let's check addPoints logic:
      // if (points > 0 && points < gameState.minPointsPerTurn) points = 0;
      // So 0 is always allowed.

      // TA: A1, A2, A3
      store.addPoints(0); // A1
      store.addPoints(0); // A2
      store.addPoints(0); // A3
      // TB: B1, B2, B3
      store.addPoints(0); // B1
      store.addPoints(0); // B2
      store.addPoints(0); // B3

      // Round 2: A1 plays 0, A2 reaches target
      store.addPoints(0);    // A1
      store.addPoints(10000); // A2 reaches target points (high enough to ensure it exceeds target even with penalties)

      const stateAfterA2 = store.state();
      expect(stateAfterA2.lastRoundStarted).toBe(true);
      expect(stateAfterA2.winnerTeamPlayerCount).toBe(2);
      // Next player should be B1, skipping A3
      expect(stateAfterA2.currentPlayerIndex).toBe(3); // Index of B1

      store.addPoints(400); // B1 plays
      store.addPoints(400); // B2 plays

      // Now game should be over because 2 players from Team B played (same as Team A)
      const finalState = store.state();
      expect(finalState.isGameOver).toBe(true);
      expect(finalState.winnerId).toBe('TA');
    });

    /**
     * Test that if the first player of the winner team reaches the target,
     * only the first player of other teams plays in the last round.
     */
    it('should end game after 1 player each if first player reaches target', () => {
      store.addPoints(1000); // P1 (Team 1) reaches target. winnerTeamPlayerCount = 1.

      const stateAfterP1 = store.state();
      expect(stateAfterP1.winnerTeamPlayerCount).toBe(1);
      // P2 should be skipped. Next is P3 (first of Team 2).
      expect(stateAfterP1.currentPlayerIndex).toBe(2);

      store.addPoints(500); // P3 (Team 2) plays.

      // Game should end after P3 because quota for Team 2 (1 player) is reached.
      expect(store.state().isGameOver).toBe(true);
    });

    /**
     * Test that if the last player of the winner team reaches target,
     * then all players of other teams play.
     */
    it('should allow all players to play if last player of winner team reaches target', () => {
      store.addPoints(0);    // P1
      store.addPoints(1000); // P2 (Team 1) reaches target. winnerTeamPlayerCount = 2.

      const stateAfterP2 = store.state();
      expect(stateAfterP2.winnerTeamPlayerCount).toBe(2);
      // Next is P3
      expect(stateAfterP2.currentPlayerIndex).toBe(2);

      store.addPoints(0); // P3
      store.addPoints(0); // P4

      expect(store.state().isGameOver).toBe(true);
    });

    /**
     * Test tie-breaking: If multiple teams reach target within their quota,
     * the one who reached it first wins if scores are equal.
     */
    it('should handle tie-breaking when multiple teams reach target within quota', () => {
      store.addPoints(1000); // P1 (Team 1) reaches 1000. Quota = 1.
      store.addPoints(1000); // P3 (Team 2) reaches 1000.

      const state = store.state();
      expect(state.isGameOver).toBe(true);
      expect(state.winnerId).toBe('t1'); // Team 1 reached it first
    });

    /**
     * Test that if a later team exceeds the first team's score within their quota, they win.
     */
    it('should allow a later team to win if they score more within their quota', () => {
      store.addPoints(1000); // P1 (Team 1) reaches 1000. Quota = 1.
      store.addPoints(1100); // P3 (Team 2) reaches 1100.

      const state = store.state();
      expect(state.isGameOver).toBe(true);
      expect(state.winnerId).toBe('t2'); // Team 2 has higher score
    });

    /**
     * Test game mode switching doesn't leave winnerTeamPlayerCount residue.
     */
    it('should reset winnerTeamPlayerCount when setting up a new game', () => {
      store.addPoints(1000); // Team game
      store.addPoints(0); store.addPoints(0); store.addPoints(0); // finish

      expect(store.state().winnerTeamPlayerCount).not.toBeNull();

      store.setupGame({
        gameMode: 'individual',
        players: [{ id: '1', name: 'P1', score: 0, dashes: 0, history: [] }]
      });

      expect(store.state().winnerTeamPlayerCount).toBeNull();
    });
  });

  /**
   * Tests for resetting the game state.
   */
  describe('resetGame', () => {
    /**
     * Test that the state is fully cleared when resetting without keeping players.
     */
    it('should reset state completely when keepPlayers is false', () => {
      store.setupGame({
        gameMode: 'individual',
        targetPoints: 1000,
        minPointsPerTurn: 350,
        players: [{ id: '1', name: 'P1', score: 0, dashes: 0, history: [] }],
        teams: []
      });
      store.resetGame(false);
      const state = store.state();
      expect(state.isStarted).toBe(false);
      expect(state.players.length).toBe(0);
    });

    /**
     * Test that scores are reset but player configurations are preserved when keepPlayers is true.
     */
    it('should reset scores but keep players when keepPlayers is true', () => {
      store.setupGame({
        gameMode: 'individual',
        targetPoints: 1000,
        minPointsPerTurn: 350,
        players: [{ id: '1', name: 'P1', score: 500, dashes: 1, history: [500, 0] }],
        teams: []
      });
      store.resetGame(true);
      const state = store.state();
      expect(state.isStarted).toBe(false);
      expect(state.players.length).toBe(1);
      expect(state.players[0].score).toBe(0);
      expect(state.players[0].dashes).toBe(0);
      expect(state.players[0].history).toEqual([]);
    });
  });

  /**
   * Tests for reordering players and setting starting player.
   */
  describe('Post-Game Reordering', () => {
    beforeEach(() => {
      const players = [
        { id: '1', name: 'P1', score: 0, dashes: 0, history: [] },
        { id: '2', name: 'P2', score: 0, dashes: 0, history: [] },
        { id: '3', name: 'P3', score: 0, dashes: 0, history: [] }
      ];
      store.setupGame({
        gameMode: 'individual',
        targetPoints: 1000,
        minPointsPerTurn: 350,
        players,
        teams: []
      });
    });

    /**
     * Test reordering players manually.
     */
    it('should reorder players correctly', () => {
      const originalPlayers = store.state().players;
      const newOrder = [originalPlayers[1], originalPlayers[2], originalPlayers[0]]; // P2, P3, P1

      store.reorderPlayers(newOrder);

      const players = store.state().players;
      expect(players[0].id).toBe('2');
      expect(players[1].id).toBe('3');
      expect(players[2].id).toBe('1');
      expect(store.state().currentPlayerIndex).toBe(0);
    });

    /**
     * Test shifting player order by selecting a starting player.
     */
    it('should shift player order when starting player is selected', () => {
      // Original: P1, P2, P3. Select P2 to start.
      store.setStartingPlayer('2');

      const players = store.state().players;
      // New order: P2, P3, P1
      expect(players[0].id).toBe('2');
      expect(players[1].id).toBe('3');
      expect(players[2].id).toBe('1');
      expect(store.state().currentPlayerIndex).toBe(0);
    });

    /**
     * Test shifting player order with more players.
     */
    it('should shift player order correctly with more players', () => {
      const players = [
        { id: '1', name: 'A', score: 0, dashes: 0, history: [] },
        { id: '2', name: 'B', score: 0, dashes: 0, history: [] },
        { id: '3', name: 'C', score: 0, dashes: 0, history: [] },
        { id: '4', name: 'D', score: 0, dashes: 0, history: [] },
        { id: '5', name: 'E', score: 0, dashes: 0, history: [] }
      ];
      store.setupGame({
        gameMode: 'individual',
        targetPoints: 1000,
        minPointsPerTurn: 350,
        players,
        teams: []
      });

      // Original: A, B, C, D, E. Select D to start.
      store.setStartingPlayer('4');

      const newPlayers = store.state().players;
      // New order: D, E, A, B, C
      expect(newPlayers[0].name).toBe('D');
      expect(newPlayers[1].name).toBe('E');
      expect(newPlayers[2].name).toBe('A');
      expect(newPlayers[3].name).toBe('B');
      expect(newPlayers[4].name).toBe('C');
    });

    /**
     * Test reordering in team mode updates team playerIds order too.
     */
    it('should update team playerIds order when reordering in team mode', () => {
      const players = [
        { id: '1', name: 'P1', score: 0, dashes: 0, history: [] },
        { id: '2', name: 'P2', score: 0, dashes: 0, history: [] },
        { id: '3', name: 'P3', score: 0, dashes: 0, history: [] },
        { id: '4', name: 'P4', score: 0, dashes: 0, history: [] }
      ];
      const teams = [
        { id: 't1', name: 'Team 1', playerIds: ['1', '2'], score: 0, dashes: 0, history: [] },
        { id: 't2', name: 'Team 2', playerIds: ['3', '4'], score: 0, dashes: 0, history: [] }
      ];
      store.setupGame({
        gameMode: 'team',
        targetPoints: 1000,
        minPointsPerTurn: 350,
        players,
        teams
      });

      // New player order: P2, P4, P1, P3
      const newOrder = [players[1], players[3], players[0], players[2]];
      store.reorderPlayers(newOrder);

      const state = store.state();
      expect(state.players[0].id).toBe('2');
      // Team 1 order should now be ['2', '1']
      expect(state.teams[0].playerIds).toEqual(['2', '1']);
      // Team 2 order should now be ['4', '3']
      expect(state.teams[1].playerIds).toEqual(['4', '3']);
      // Current team should be Team 1 because P2 is in Team 1
      expect(state.currentTeamIndex).toBe(0);
    });

    /**
     * Test that setupGame correctly updates team playerIds order.
     */
    it('should update team playerIds order when setupGame is called in team mode', () => {
      const players = [
        { id: '1', name: 'P1', score: 0, dashes: 0, history: [] },
        { id: '2', name: 'P2', score: 0, dashes: 0, history: [] },
        { id: '3', name: 'P3', score: 0, dashes: 0, history: [] },
        { id: '4', name: 'P4', score: 0, dashes: 0, history: [] }
      ];
      const teams = [
        { id: 't1', name: 'Team 1', playerIds: ['1', '2'], score: 0, dashes: 0, history: [] },
        { id: 't2', name: 'Team 2', playerIds: ['3', '4'], score: 0, dashes: 0, history: [] }
      ];

      // New player order: P2, P4, P1, P3
      const orderedPlayers = [players[1], players[3], players[0], players[2]];

      store.setupGame({
        gameMode: 'team',
        targetPoints: 1000,
        minPointsPerTurn: 350,
        players: orderedPlayers,
        teams
      });

      const state = store.state();
      expect(state.players[0].id).toBe('2');
      // Team 1 order should now be ['2', '1'] because 2 comes before 1 in orderedPlayers
      expect(state.teams[0].playerIds).toEqual(['2', '1']);
      // Team 2 order should now be ['4', '3']
      expect(state.teams[1].playerIds).toEqual(['4', '3']);
      // Current team should be Team 1 because P2 (first player) is in Team 1
      expect(state.currentTeamIndex).toBe(0);
    });
  });
});
