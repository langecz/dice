# Plan - Game History Implementation

Implementation plan for the `Game history` section of `requirements.md`.

## 1. Data Model Updates
- Update `src/app/models/game.models.ts`:
    - Add `wins: number` to `Player` and `Team` interfaces.
    - Add `GameRecord` interface:
        ```typescript
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
          gameNumber: number;
          winnerId: string; // either teamId or playerId
          winnerName: string; // either teamName or playerName
          rounds: RoundRecord[];
        }
        ```
    - Add `gameHistory: GameRecord[]` to `GameState`.
    - Add `currentTurnRecords: PlayerTurnRecord[]` and `currentRoundNumber: number` to `GameState` to track ongoing game.

## 2. Store Logic Updates
- Update `src/app/services/game.store.ts`:
    - **Initialization**: Ensure `wins` and `gameHistory` are correctly handled in `loadFromStorage`.
    - **Recording Turns**:
        - In `addPoints`, record each player's turn into `currentTurnRecords`.
        - When a round finishes (back to first player), wrap `currentTurnRecords` into a `RoundRecord` and add to a temporary round list in state.
    - **Game Completion**:
        - When `isGameOver` becomes true, finalize the `GameRecord`.
        - Calculate `scoreSummary` based on cumulative wins.
        - Update `wins` for the winning player/team.
        - Add the `GameRecord` to `gameHistory`.
    - **Reset Logic**:
        - `resetGame(keepPlayers: true)`: Reset game state but PRESERVE `gameHistory` and `wins`.
        - `resetGame(keepPlayers: false)`: Clear everything including `gameHistory` and `wins`.

## 3. UI Implementation
- **Winner Card Updates** (`src/app/components/dashboard/dashboard.component.ts/html`):
    - Display `Final Rankings` as before.
    - Add a section below `Final Rankings` showing `Total Wins` for each player/team, sorted by win count.
- **Game History Component**:
    - Create `src/app/components/game-history/game-history.component.ts/html/scss`.
    - Use `MatExpansionModule` for the accordion structure:
        - Top-level: `Game X (Winner: ..., Score: ...)`
        - Second-level: `Round Y`
        - Content: List of players and their points.
    - Use the "Log" button in the main navigation/header (likely `src/app/components/main-page/main-page.component.html`) to route to `/history`.
- **Routing**:
    - Add `/history` route to `src/app/app.routes.ts` pointing to `GameHistoryComponent`.

## 4. Verification
- Add unit tests in `src/app/services/game.store.spec.ts` to verify:
    - Turn recording during the game.
    - Round finalization.
    - Game history archival upon the game end.
    - Win count incrementing.
    - Reset behavior (preserving history vs. clearing it).
- Manual verification of the "Log" view with the example data provided in `requirements.md`.
