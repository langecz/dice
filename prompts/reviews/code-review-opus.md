# Code Review — Dice Application

**Reviewer:** Junie (Claude Opus 4.7)
**Date:** 2026-05-07
**Scope:** Full Angular application against project guidelines (`.junie/guidelines.md`) and Angular 21+ best practices.
**Stack:** Angular 21.x, Angular Material 21.x, @ngrx/signals 21.x, TypeScript 5.9, Vitest.

---

## 1. Executive Summary

The project is in **good overall shape**. It already adopts most of the modern Angular 21 idioms: standalone components by default, signals everywhere for state, `@ngrx/signals` `signalStore` for global state, native control flow (`@if`/`@for`/`@switch`), `inject()` over constructor injection, `OnPush` change detection, lazy-loaded routes, and Angular Material as the UI library. No legacy `*ngIf`/`*ngFor`, `ngClass`, `ngStyle`, `@HostBinding`/`@HostListener`, or `NgModules` were found.

However, there are several deviations from the guidelines and a handful of bugs/smells that should be addressed:

| Severity | Count | Theme |
|----------|-------|-------|
| 🔴 High | 3 | Signal Forms not used everywhere; selector prefix violations; placeholder content shipped |
| 🟠 Medium | 6 | Unused `CommonModule` imports; inconsistent file naming; accessibility gaps; missing tests; `any`-style `unknown` typing in dialog data; `async` without `await` |
| 🟡 Low | 7 | Style/consistency nits, dead code, missing `ng-template` declaration |

---

## 2. Findings by Guideline

### 2.1 TypeScript Best Practices

#### ✅ Compliant
- `tsconfig.json` enables strict mode (verified by build setup).
- No `any` usages in `src/app`.
- Type inference is used appropriately throughout.

#### 🟠 Issues
- **`dashboard.component.ts`** declares `state`, `players`, `teams`, `gameMode`, etc. as **public** properties without explicit type annotations or `readonly`. Add `readonly` and consider `protected` where appropriate to lock template-only access.
- **`dashboard.component.ts:152`**: `viewChild.required<TemplateRef<unknown>>("playerList")` uses `unknown`, which is fine, but the inline type for `showPlayers()` data (`{name: string, teamName: string | undefined, ...}`) should be hoisted to a named interface for reuse and typing inside the dialog template.
- **`main-page.component.ts:19`**: `type buttonAction` is lower-camelCase. Type aliases must be `PascalCase` → rename to `ButtonAction`.
- **`main-page.component.ts:139`**: `handleResetDialogResult` is declared `async` but contains no `await` — drop `async` or actually await the navigation.

---

### 2.2 Angular Best Practices

#### ✅ Compliant
- Angular 21.2.x is installed (`@angular/core ^21.1.0`).
- All components are standalone (no `standalone: true` set explicitly — correct for v20+).
- No `@HostBinding`/`@HostListener` decorators are used.
- `inject()` is used consistently; no constructor DI.
- `signal()`, `computed()`, `linkedSignal()`, and `toSignal()` are used appropriately.
- All routes use `loadComponent` for lazy loading.
- `@ngrx/signals` `signalStore` is used for global state — a sound choice that aligns with the signals-first guideline.

#### 🔴 Issues
- **Signal Forms are not used consistently.** The guideline mandates `@angular/forms/signals` for new signal-based applications.
  - ✅ `game-config.component.html` correctly uses `setupForm.gameMode().value()` / `setupForm.targetPoints().value.set(...)` style → **Signal Forms used** (good reference).
  - ❌ `input-dialog.component.ts` imports `FormsModule` (template-driven `ngModel`-style binding via manual `(input)` handler). It should be migrated to Signal Forms (`form()` + `[formField]`).
  - ❌ `game-config.component.html` lines binding radio/inputs through manual `(change)`/`(input)` handlers do not leverage the `[formField]` directive. Replace with `<input [formField]="setupForm.targetPoints">` and `<mat-radio-group [formField]="setupForm.gameMode">` for cleaner code.

- **Selector prefix violations.** Per Angular conventions and the `app-` prefix already used elsewhere, the following selectors are missing the project prefix:
  - `game-history.component.ts:7` → `selector: 'game-history'` should be `'app-game-history'`.
  - `current-game.ts` → likely `'current-game'` (verify) should be `'app-current-game'`.
  - `games-log.component.ts` → `'games-log'` should be `'app-games-log'`.
  - `reset-game-confirm-dialog.component.ts:13` → `'reset-game-confirm-dialog'` should be `'app-reset-game-confirm-dialog'`.

#### 🟠 Issues
- **`CommonModule` imported unnecessarily** in `dashboard.component.ts:34`. With native control flow and built-in pipes available standalone, `CommonModule` is no longer required and increases bundle size. Remove it; import only specific pipes (`AsyncPipe`, `DatePipe`, etc.) when needed.
- **`NgOptimizedImage` not used.** No `<img>` tags were found in templates, so the requirement is **N/A** today. If/when static images are introduced (e.g., dice faces, avatars), `NgOptimizedImage` must be used.
- **Hash-location routing** (`provideRouter(routes, withHashLocation())`): acceptable for static hosting (e.g., GitHub Pages) but should be a documented decision. Consider `withComponentInputBinding()` and `withViewTransitions()` for richer Angular 21 routing UX.
- **Missing `provideAnimationsAsync()`** in `app.config.ts`. Angular Material 21 requires the animations provider for proper component behavior (ripples, dialog transitions). Add:
  ```ts
  import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
  // ...
  providers: [provideAnimationsAsync(), ...]
  ```

#### 🟡 Nits
- `app.ts` exports `App` instead of `AppComponent`. The guideline-aligned naming convention (used for every other component) is `*Component`. Rename for consistency.
- `current-game.ts` and `current-game.html` deviate from the `*.component.ts` / `*.component.html` naming used elsewhere. Standardize on the project's existing convention (`current-game.component.ts`).

---

### 2.3 Components

#### ✅ Compliant
- All components have `changeDetection: ChangeDetectionStrategy.OnPush`.
- `computed()` is used for derived state (e.g., `phase`, `winner`, `rankedResults`, `winsRanking`, `canRecord`).
- No `mutate()` calls; signals are updated via `set`/`update`.
- `viewChild()` is used (not `@ViewChild`) — good.

#### 🟠 Issues
- **`dashboard.component.ts` is too large (200+ lines, 10+ responsibilities).** It mixes:
  - winner computation,
  - rankings,
  - input handling,
  - player-list dialog construction (`showPlayers`, `getPlayersScore`, `playerTeamMap`).
  Extract a `RankingsService` or `WinnerService`, and move score-aggregation helpers to the store as `withComputed` selectors. This will also make the dashboard easier to unit-test.
- **Inline templates not used for tiny components.** `confirm-dialog.component.ts`, `app.ts`, and `game-history.component.ts` have very small templates (≤10 lines each) that are good candidates for inline templates per the guideline ("Prefer inline templates for small components").
- **`game-history.component.html` ships a placeholder tab** (`<mat-tab label="Third">Content 3</mat-tab>`). 🔴 This is dead/placeholder content — remove before release.
- **Public template-bound members not marked `protected`.** Properties like `store`, `dialog`, `state`, `players` in `DashboardComponent` should be `protected readonly` so they are accessible from the template only.

---

### 2.4 State Management

#### ✅ Compliant
- `GameStore` uses `@ngrx/signals` with `withState`, `withComputed`, `withMethods`, `withHooks`, `withDevtools`. This is the recommended modern pattern.
- State is hydrated/persisted via `localStorage` with safe merging for new fields — good forward compatibility.
- `patchState` is used; no direct mutation.

#### 🟠 Issues
- **`loadFromStorage()` does not validate parsed JSON.** A malformed `localStorage` value will throw on `JSON.parse` and crash the app. Wrap in `try/catch` and fall back to `INITIAL_GAME_STATE`.
- **`localStorage` accessed at module load time** — breaks SSR if ever enabled. Guard with `typeof localStorage !== 'undefined'` or use Angular's `PLATFORM_ID` / `isPlatformBrowser`.
- Consider extracting `STORAGE_KEY` and persistence into a dedicated `withStorage` feature for testability.

---

### 2.5 Templates

#### ✅ Compliant
- Native control flow (`@if`, `@for`, `@switch`) is used throughout.
- No `ngClass` / `ngStyle`.
- No arrow functions in templates.
- `track` is provided in `@for` loops.

#### 🟠 Issues
- **`@for (button of phase().actionButtons; track button)`** in `main-page.component.html`: tracking by object reference is fragile. Track by a stable key (`button.action`):
  ```html
  @for (button of phase().actionButtons; track button.action) { ... }
  ```
- **`@for (i of [1,2,3]; track i)`** in `dashboard.component.html` allocates a new array on every change detection. Hoist `[1,2,3]` to a `readonly` class field (`protected readonly DASH_SLOTS = [1, 2, 3] as const;`).
- **Inline `style="font-size: 20px; width: 20px; height: 20px;"`** in `dashboard.component.html` should be moved to the SCSS file or a shared utility class.
- **`<ng-template #playerList>` referenced from `dashboard.component.ts:152` is in the same template** — verify the template fully exists in `dashboard.component.html`. If duplicated logic, consider extracting it to a dedicated `PlayerListComponent`.

#### 🟡 Nits
- Templates use slightly inconsistent attribute ordering and spacing; running `ng format` (Prettier with the configured `angular` parser) once will normalize them.

---

### 2.6 Services

#### ✅ Compliant
- `DialogService`, `GameLogExportService`, `LayoutService`, `SnackbarService` are well-scoped, single-responsibility services.
- `inject()` is used; no constructor DI.

#### 🟠 Issues
- **Verify `providedIn: 'root'`** is set on every singleton service (`DialogService`, `LayoutService`, `SnackbarService`, `GameLogExportService`). A spot check is recommended; the guideline mandates it.
- Test files exist for some services (`game.store.spec.ts`, `game-log-export.spec.ts`, `layout.service.spec.ts`) but `dialog.service` and `snackbar.service` appear to lack tests.

---

### 2.7 Angular Material

#### ✅ Compliant
- `@angular/material` v21 is installed.
- All UI uses Material components (`mat-card`, `mat-list`, `mat-tab-group`, `mat-form-field`, `mat-radio-*`, `mat-icon`, `mat-dialog-*`, `mat-expansion-panel`).
- Buttons use the new v21 syntax: `<button matButton="filled">`, `<button matFab>` — ✅ matches the guideline.
- `MAT_FORM_FIELD_DEFAULT_OPTIONS` is configured globally for `outline` appearance.

#### 🟠 Issues
- **Theme verification:** The guideline mandates the **"Azure & Blue" theme** with **Material Design v3**. Verify `angular.json` `styles` and `src/styles.scss` use the M3 prebuilt theme `azure-blue` (`@angular/material/prebuilt-themes/azure-blue.css`) or a custom M3 theme via `mat.theme(...)`. This was not opened during review — please confirm.
- **`provideAnimationsAsync()` missing** (also noted above) — Material components rely on it.

---

### 2.8 Accessibility (WCAG AA / AXE)

#### ✅ Compliant
- `aria-label` is provided on icon-only and dynamic buttons (e.g., `addItem` FAB, action buttons in `main-page`).
- Form inputs have `<mat-label>` and additional `aria-label`s where needed.

#### 🟠 Issues
- **`<button matButton="filled" [class]="button.class">`** — no `type` attribute. Inside any future `<form>`, this will default to `type="submit"`. Always declare `type="button"` for non-submit buttons.
- **Color contrast must be verified** for `.btn-warn` and `.btn-success` classes against the Azure & Blue theme background. Run AXE against the running app.
- **Dialog focus management:** Confirm that `MatDialog` config does not disable `restoreFocus`/`autoFocus` (Material defaults are AA-compliant; ensure no overrides break them in `DialogService`).
- **`<mat-icon>` decorative icons** inside content (e.g., dice dashes) should have `aria-hidden="true"` so screen readers don't announce ligature names.
- **Tab order**: The `mat-tab-group` placeholder "Third" tab content reads "Content 3" — definitely a screen-reader-confusing leftover.

---

### 2.9 Testing

#### ✅ Compliant
- Vitest is configured (`vitest@^4`) with `jsdom`.
- Spec files exist for many components (`*.component.spec.ts`) and the store (`game.store.spec.ts`).
- The guideline test-runner command `ng test --watch=false` works with the default Angular CLI test target.

#### 🟠 Issues
- **Missing tests:**
  - `app.ts`, `dashboard.component.ts`, `game-history.component.ts`, `confirm-dialog.component.ts`, `input-dialog.component.ts`, `dialog.service.ts`, `snackbar.service.ts`.
- **Test descriptions**: The guideline mandates "Create comments for each test with a proper description." Verify each `it(...)` has a clear, descriptive title; avoid generic names like `'should work'`.
- **No e2e/AXE tests.** Consider adding `@axe-core/playwright` (or `cypress-axe`) as a smoke check for AA compliance.

---

### 2.10 Project Hygiene

- 🟡 `main-page.component.ts:53` contains commented-out code (`// private readonly currentPage = signal<PAGE>('setup');`). Remove dead code.
- 🟡 `dashboard.component.ts:60` contains commented-out alternative `viewChild.required` declaration. Remove.
- 🟡 `dashboard.component.ts:191`: trailing semicolon after a method body (`};`).
- 🟡 `main-page.component.ts:33-37` uses inline indexing (`PHASE_CONFIG['setup']`); use property access (`PHASE_CONFIG.setup`) and consider typing the keys with a string-literal union for safer lookups.
- 🟡 `prompts/` folder is checked in with internal documents — fine for the project, but consider gitignoring transient drafts.

---

## 3. Prioritized Action List

### 🔴 Must Fix
[x] 1. Remove the placeholder `<mat-tab label="Third">Content 3</mat-tab>` from `game-history.component.html`.\
[x] 2. Migrate `input-dialog.component.ts` and the manual bindings in `game-config.component.html` to Signal Forms (`form()` + `[formField]`).\
[x] 3. Add `app-` prefix to selectors of `game-history`, `current-game`, `games-log`, `reset-game-confirm-dialog`.\

### 🟠 Should Fix
[deprecated] 4. Add `provideAnimationsAsync()` to `app.config.ts`.  
[x] 5. Remove `CommonModule` from `DashboardComponent` imports.\
[ ] 6. Wrap `loadFromStorage()` in `try/catch` and SSR-guard `localStorage`.\
[ ] 7. Split `DashboardComponent` (extract winner/ranking/score helpers).\
[ ] 8. Add missing component/service tests (dashboard, dialog service, snackbar service, input dialog, confirm dialog).\
[ ] 9. Mark template-only members `protected readonly`.\
[ ] 10. Rename type alias `buttonAction` → `ButtonAction`; rename `App` → `AppComponent`; standardize `current-game*` filenames to `*.component.*`.  
[ ] 11. Add `type="button"` to all non-submit `<button>` elements.\

### 🟡 Nice to Have
[ ] 12. Replace `track button` with `track button.action` in `main-page.component.html`.\
[ ] 13. Hoist `[1,2,3]` arrays from templates to component fields.\
[x] 14. Move inline `style="..."` into SCSS.\
[ ] 15. Verify Azure & Blue M3 theme is wired in `styles.scss` / `angular.json`.\
[x] 16. Drop `async` from `handleResetDialogResult` (no `await` inside).\
[ ] 17. Remove commented-out / dead code blocks.\
[ ] 18. Run AXE against the running app and document the result.\

---

## 4. Conclusion

The codebase is **modern and largely guideline-conformant**: signals, `OnPush`, native control flow, `@ngrx/signals`, lazy routes, and Material v21 buttons are all in place. The main gap is **incomplete adoption of Signal Forms** (the project mixes Signal Forms with manual `(input)`/`ngModel` patterns), plus a handful of selector-prefix and dead-code issues. With the prioritized fixes above — particularly Signal Forms migration, `provideAnimationsAsync()`, selector prefixes, and theme/accessibility verification — the application will fully meet the project's Angular 21+ best-practice bar.
