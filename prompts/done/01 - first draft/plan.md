# Implementation Plan: Dice Game Score Keeper (Angular Material Edition)

This plan outlines the steps for building a mobile-optimized Angular web application to track scores for a dice game, utilizing Angular Material for a high-quality, accessible UI.

## 1. Project Infrastructure & Configuration
- **Initialize Material:** Run `ng add @angular/material` to set up the component library and theming.
- **Global Styles:** Configure the Material theme and ensure mobile-first responsive layout via standard Material/CDK tools (like `Layout/BreakpointObserver`).
- **Cleanup:** Remove default boilerplate code from `app.html` and `app.ts`.

## 2. Domain Model & State Management
- **Define core models:**
    - `Player`: id, name, score, dashes (three 0s in a row), history.
    - `Team`: id, name, players, totalScore, totalDashes.
    - `GameMode`: Individual or Team.
    - `GameState`: currentRound, currentPlayerIndex, currentTeamIndex, gameMode, targetPoints (default 10,000), winner, isGameOver.
- **State Store (Signal-based):**
    - Create a `GameStore` service using Angular Signals.
    - Implement persistence using `localStorage`.
    - Implement "New Game" function (reset state, optional player preservation).
    - Support reordering of players/teams (integrated with Material Drag & Drop).

## 3. Core Logic (Rules Engine)
- **Scoring logic:**
    - Record points, handle "dash" logic (three consecutive 0s = -500 points).
    - In team mode, 500 points deduction if three consecutive players on the same team roll 0.
- **Turn management:**
    - Calculate next player/team and identify game end.

## 4. UI Components (Angular Material & Signal Forms)
- **Setup View:**
    - `MatStepper` or simple vertical layout with `MatCard`.
    - `MatRadioGroup` for Game Mode selection.
    - `MatFormField` & `MatInput` for player/team entry and target points.
    - `CdkDropList` for reordering turns.
    - `MatButton` for "Start Game".
- **Game Dashboard View:**
    - `MatToolbar` for game status and "New Game" access.
    - `MatCard` for current turn info.
    - Numerical input using `MatInput` for recording points.
    - `MatList` or `MatTable` for scores and dashes.
    - Accessible feedback using `MatSnackBar` for events like point deductions.
- **Game Over View:**
    - `MatDialog` or full-screen `MatCard` overlay.
    - Confetti/visual celebration (optional).
    - "New Game" options using `MatButton` and `MatDialog`.

## 5. Technical Requirements & Best Practices
- **Angular:** v21+, Standalone components, Signals, `inject()`, `computed()`.
- **Forms:** **Signal Forms** (@angular/forms/signals) integrated with Material components.
- **Accessibility:** Ensure ARIA labels, focus management (via Material's `A11y` module), and clean AXE checks.
- **Performance:** `OnPush` change detection, `NgOptimizedImage` for static assets.

## 6. Development Phases
1.  **Phase 1: Setup & Store.** Material installation, model definitions, and Signal-based store with persistence.
2.  **Phase 2: Game Logic & Setup UI.** Implementation of scoring rules and the configuration screen using Material components and Signal Forms.
3.  **Phase 3: Game Dashboard.** Main interface for turn tracking and point entry.
4.  **Phase 4: Game Over & Polish.** Winning state, reset flow, and accessibility/mobile refinement.
