import { TestBed } from '@angular/core/testing';
import { GameStore } from './game.store';

describe('GameStore - Team Mode Bug Reproduction', () => {
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
   * Reproduction of the reported bug:
   * Teams A (A1, A2, A3) and B (B1, B2, B3).
   * Order: A1, A2, A3, B1, B2, B3.
   * Player B1 starts.
   * B1 rolls 9000, B2 rolls 1100.
   * Target is 10000.
   * Expected: Last round starts, A1 and A2 must play (2 turns each for both teams).
   */
  it('should allow other teams to play their turns when a team reaches target points in the middle of their turn', () => {
    const players = [
      { id: 'A1', name: 'A1', score: 0, dashes: 0, history: [] },
      { id: 'A2', name: 'A2', score: 0, dashes: 0, history: [] },
      { id: 'A3', name: 'A3', score: 0, dashes: 0, history: [] },
      { id: 'B1', name: 'B1', score: 0, dashes: 0, history: [] },
      { id: 'B2', name: 'B2', score: 0, dashes: 0, history: [] },
      { id: 'B3', name: 'B3', score: 0, dashes: 0, history: [] },
    ];
    const teams = [
      { id: 'T_A', name: 'Team A', playerIds: ['A1', 'A2', 'A3'], score: 0, dashes: 0, history: [] },
      { id: 'T_B', name: 'Team B', playerIds: ['B1', 'B2', 'B3'], score: 0, dashes: 0, history: [] },
    ];

    store.setupGame({
      gameMode: 'team',
      targetPoints: 10000,
      minPointsPerTurn: 300,
      players,
      teams
    });

    // Set B1 as starting player. This reorders players so B1 is at index 0.
    store.setStartingPlayer('B1');

    expect(store.state().currentPlayerIndex).toBe(0); // B1
    expect(store.state().currentTeamIndex).toBe(1); // Team B

    // B1 rolls 9000
    store.addPoints(9000);
    expect(store.state().teams[1].score).toBe(9000);
    expect(store.state().lastRoundStarted).toBe(false);

    // B2 rolls 1100
    store.addPoints(1100);

    let state = store.state();
    expect(state.teams[1].score).toBe(10100);
    expect(state.lastRoundStarted).toBe(true);
    expect(state.winnerTeamPlayerCount).toBe(2);

    // Game should NOT be over. Next should be A1.
    expect(state.isGameOver).toBe(false);
    expect(state.currentPlayerIndex).toBe(3); // A1 is at index 3 in reordered array [B1, B2, B3, A1, A2, A3]

    // A1 rolls 500
    store.addPoints(500);
    state = store.state();
    expect(state.isGameOver).toBe(false);
    expect(state.currentPlayerIndex).toBe(4); // A2

    // A2 rolls 500
    store.addPoints(500);
    state = store.state();

    // Now it should be over because Team A used its quota of 2 players.
    expect(state.isGameOver).toBe(true);
    expect(state.winnerId).toBe('T_B');
  });
});
