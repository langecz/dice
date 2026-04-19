# Task List: Dice Game Score Keeper (Angular Material Edition)

## Phase 1: Infrastructure, Store & Models
- [x] Install Angular Material: `ng add @angular/material`
- [x] Clean up default boilerplate from `app.html` and `app.ts`
- [x] Define Core Models (`Player`, `Team`, `GameMode`, `GameState`)
- [x] Implement `GameStore` Service using Angular Signals
- [x] Implement `localStorage` Persistence in `GameStore`
- [x] Add "New Game" Logic (reset state, optional player preservation)
- [x] Add reordering logic in store (for players/teams)

## Phase 2: Core Logic & Setup UI (Material)
- [x] Implement scoring logic (points recording, -500 penalty on 3 dashes)
- [x] Implement turn management (calculate next up, detect winner)
- [x] Create Setup Component with `MatCard` and `MatRadioGroup` for Game Mode
- [x] Implement Player/Team entry using **Signal Forms** and `MatFormField`
- [x] Implement turn reordering using `CdkDragDrop`
- [x] Implement Target Points configuration with `MatInput`
- [x] Add "Start Game" validation and navigation using `MatButton`

## Phase 3: Game Dashboard (Material)
- [x] Create Game Dashboard Component with `MatToolbar` for status info
- [x] Implement "Current Turn" card with `MatCard` and point entry
- [x] Create scoreboard using `MatList` (display points, dashes, history)
- [x] Implement visual feedback/alerts for scoring events (e.g., `MatSnackBar` for penalties)
- [x] Ensure the layout is fully responsive for mobile devices

## Phase 4: Game Over & Reset (Material)
- [x] Create Game Over state/view (using `MatDialog` or overlay)
- [x] Display winner and final stats prominently
- [x] Implement "New Game" dialog to confirm keeping/clearing players

## Phase 5: Final Polish & Accessibility
- [x] Verify accessibility using standard Material A11y tools and AXE checks
- [x] Ensure WCAG AA compliance (contrast, ARIA labels, focus management)
- [x] Final UI/UX refinement (mobile touch targets, spacing, theming)
- [x] Verify all guidelines from `.junie/guidelines.md` are met
