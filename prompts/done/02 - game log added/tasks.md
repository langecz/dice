# Tasks - Game History Implementation

## 1. Data Model Updates
- [x] Update `src/app/models/game.models.ts` [x]
    - [x] Add `wins: number` to `Player` and `Team` interfaces
    - [x] Define `PlayerTurnRecord` interface
    - [x] Define `RoundRecord` interface
    - [x] Define `GameRecord` interface
    - [x] Add `gameHistory: GameRecord[]` to `GameState`
    - [x] Add `currentTurnRecords: PlayerTurnRecord[]` and `currentRoundNumber: number` to `GameState`

## 2. Store Logic Updates
- [x] Update `src/app/services/game.store.ts` [x]
    - [x] Update `loadFromStorage` and `saveToStorage` to handle `wins` and `gameHistory`
    - [x] Implement turn recording logic in `addPoints`
    - [x] Implement round finalization logic
    - [x] Implement game completion logic: finalize `GameRecord`, update `wins`, and archive to `gameHistory`
    - [x] Update `resetGame` to optionally preserve `gameHistory` and `wins` based on `keepPlayers` flag

## 3. UI Implementation
- [x] Update Winner Card in Dashboard [x]
    - [x] Update `src/app/components/dashboard/dashboard.component.html` to display `Total Wins` section
    - [x] Update `src/app/components/dashboard/dashboard.component.ts` to provide necessary win count data
- [x] Create Game History Component [x]
    - [x] Generate `GameHistoryComponent` in `src/app/components/game-history/`
    - [x] Implement template with `MatExpansionModule` for accordion structure
    - [x] Implement component logic to fetch and format `gameHistory` from the store
    - [x] Add styling for the history logs
- [x] Routing and Navigation [x]
    - [x] Add `/history` route to `src/app/app.routes.ts`
    - [x] Add "Log" button to the main navigation (e.g., `src/app/components/main-page/main-page.component.html`)

## 4. Verification
- [x] Unit Testing [x]
    - [x] Add tests in `src/app/services/game.store.spec.ts` for turn recording
    - [x] Add tests for round and game finalization
    - [x] Add tests for win count persistence and reset behavior
- [x] Manual Verification [x]
    - [x] Verify the "Log" view with sample data from `requirements.md`
    - [x] Ensure WCAG AA compliance and AXE checks pass for the new component
