### Responsive Design Proposal for Dice App

Support three main breakpoints targeting Samsung A56 (mobile), tablet, and laptop screens.

### Target Resolutions

| Device | Reference | Logical viewport (CSS px) | Breakpoint range |
|---|---|---|---|
| Mobile | Samsung A56 (1080×2340 @ 3x DPR) | ~360×780 | `< 600px` |
| Tablet | iPad / generic Android tablet | 768×1024 | `600px – 1023px` |
| Laptop | 13"–15" laptop | 1366×768 and up | `≥ 1024px` |

### Strategy Overview

1. **Mobile-first CSS** — base styles target Samsung A56 (~360 px wide); larger screens enhance via `min-width` media queries.
2. **Use Angular CDK `BreakpointObserver`** for component-level layout decisions (signal-based).
3. **Use Angular Material responsive primitives** (`MatGridList`, `MatSidenav`, `MatToolbar`) — already part of the required UI library.
4. **CSS custom properties + container queries** for fine-grained control inside reusable components.
5. **Fluid typography & spacing** with `clamp()` so the UI scales smoothly between breakpoints.

### 1. Define Breakpoint Tokens

Create `src/styles/_breakpoints.scss`:

```scss
$bp-mobile-max: 599.98px;   // Samsung A56 and other phones
$bp-tablet-min: 600px;
$bp-tablet-max: 1023.98px;
$bp-laptop-min: 1024px;

@mixin mobile  { @media (max-width: #{$bp-mobile-max})  { @content; } }
@mixin tablet  { @media (min-width: #{$bp-tablet-min}) and (max-width: #{$bp-tablet-max}) { @content; } }
@mixin laptop  { @media (min-width: #{$bp-laptop-min}) { @content; } }
```

Aligns with Angular Material's `Breakpoints.XSmall / Small / Medium+`.

### 2. Global `styles.scss`

```scss
@use 'styles/breakpoints' as *;

:root {
  --app-gap: 8px;
  --app-padding: 12px;
  --app-font-base: 14px;
  --app-max-width: 100%;
}

@include tablet {
  :root {
    --app-gap: 12px;
    --app-padding: 20px;
    --app-font-base: 16px;
    --app-max-width: 720px;
  }
}

@include laptop {
  :root {
    --app-gap: 16px;
    --app-padding: 32px;
    --app-font-base: 16px;
    --app-max-width: 1120px;
  }
}

html, body { font-size: var(--app-font-base); }

/* Fluid headings */
h1 { font-size: clamp(1.25rem, 2.5vw + 0.5rem, 2rem); }
h2 { font-size: clamp(1.1rem, 1.8vw + 0.5rem, 1.5rem); }

/* Safe area for phones with notches */
.app-shell {
  padding:
    max(var(--app-padding), env(safe-area-inset-top))
    var(--app-padding)
    max(var(--app-padding), env(safe-area-inset-bottom));
  max-width: var(--app-max-width);
  margin-inline: auto;
}
```

### 3. Ensure Correct Viewport (`index.html`)

```html
<meta name="viewport"
      content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#1976d2">
```

### 4. Signal-Based `LayoutService`

```ts
import { inject, Injectable, signal } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

export type DeviceKind = 'mobile' | 'tablet' | 'laptop';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  private readonly bp = inject(BreakpointObserver);

  readonly device = toSignal<DeviceKind>(
    this.bp
      .observe([Breakpoints.XSmall, Breakpoints.Small, Breakpoints.Medium])
      .pipe(map(s => {
        if (s.breakpoints[Breakpoints.XSmall]) return 'mobile';
        if (s.breakpoints[Breakpoints.Small])  return 'tablet';
        return 'laptop';
      })),
    { initialValue: 'mobile' }
  );

  readonly isMobile = () => this.device() === 'mobile';
  readonly isTablet = () => this.device() === 'tablet';
  readonly isLaptop = () => this.device() === 'laptop';
}
```

Usage in a component:

```ts
private readonly layout = inject(LayoutService);
protected readonly cols = computed(() =>
  this.layout.device() === 'laptop' ? 3
  : this.layout.device() === 'tablet' ? 2 : 1);
```

```html
<mat-grid-list [cols]="cols()" gutterSize="12px">
  @for (p of players(); track p.id) {
    <mat-grid-tile>…</mat-grid-tile>
  }
</mat-grid-list>
```

### 5. Per-Screen Layout Recommendations

- **Dashboard (game in progress)**
  - Mobile: single column, sticky bottom action bar (`RECORD`, `ZERO`), large 48 px tap targets, points input full-width.
  - Tablet: two columns — players/teams list left, current turn panel right.
  - Laptop: three columns — players, current turn, history/log.

- **Setup (players & ordering)**
  - Mobile: stacked cards, drag handles on the right; full-width inputs.
  - Tablet: two-pane (teams ↔ ordering side by side using `mat-sidenav` mode `side`).
  - Laptop: same two-pane plus extra config panel (target points, min points).

- **Dialogs (`mat-dialog`)**
  - Mobile: full-screen — set `width: '100vw'`, `maxWidth: '100vw'`, `height: '100vh'`.
  - Tablet/Laptop: standard centered dialog with `width: '480px'` / `'640px'`.

```ts
const isMobile = layout.isMobile();
this.dialog.open(ConfirmDialog, {
  width:  isMobile ? '100vw' : '420px',
  height: isMobile ? '100vh' : 'auto',
  maxWidth: isMobile ? '100vw' : '90vw',
});
```

### 6. Touch & Accessibility

- Minimum tap target **48×48 px** (WCAG 2.5.5) — enforce on `button[matButton]` via global SCSS.
- Provide `cdkDragHandle` on a clearly visible icon for drag-and-drop on touch devices.
- Use `:focus-visible` outlines; do not remove focus rings on mobile.
- Maintain color contrast ≥ 4.5:1 — Material "Azure & Blue" theme already complies.
- Test with screen reader (TalkBack on Samsung A56).

### 7. Container Queries for Reusable Components

For components reused in different layout slots:

```scss
.player-card {
  container-type: inline-size;
}
@container (min-width: 320px) {
  .player-card__name { font-size: 1.1rem; }
  .player-card__actions { flex-direction: row; }
}
```

### 8. Testing Plan

- **Unit**: test `LayoutService.device()` by mocking `BreakpointObserver` for each breakpoint.
- **Component**: assert that `cols()` / template branches react to device signal changes.
- **E2E / manual**: Chrome DevTools device presets:
  - Samsung Galaxy A51/71 (close to A56 viewport ~412×915) — Samsung A56 logical viewport ~384×832.
  - iPad Mini (768×1024).
  - Laptop 1366×768 and 1440×900.
- Run `ng test --watch=false` after each change.

### Sample Test

```ts
it('returns "mobile" when XSmall breakpoint matches', () => {
  // Verifies LayoutService maps CDK XSmall -> mobile device kind
  const bp = { observe: () => of({ breakpoints: { [Breakpoints.XSmall]: true } }) };
  TestBed.configureTestingModule({
    providers: [{ provide: BreakpointObserver, useValue: bp }],
  });
  expect(TestBed.inject(LayoutService).device()).toBe('mobile');
});
```

### Summary

- Mobile-first SCSS with three breakpoints (`<600`, `600–1023`, `≥1024`).
- CSS variables + `clamp()` for fluid spacing/typography.
- `LayoutService` exposing a `device` **signal** powered by CDK `BreakpointObserver`.
- Angular Material primitives (`MatGridList`, `MatSidenav`, full-screen dialogs on mobile) drive layout changes.
- Enforce 48 px touch targets, safe-area insets, and AXE/WCAG AA compliance.
