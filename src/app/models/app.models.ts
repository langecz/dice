/**
 * Application-level state that is distinct from game domain state.
 * Lives alongside GameState in the store but is never persisted to storage.
 */
export interface ApplicationState {
  /**
   * Incremented on every resetGame() call so reactive consumers (e.g. linkedSignal)
   * can detect resets even when the resulting game-state values are identical to the
   * previous state (e.g. resetting while the store is still at its defaults).
   */
  resetId: number;
}

export const INITIAL_APPLICATION_STATE: ApplicationState = {
  resetId: 0,
};

