import { inject, Injectable, computed } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

export type DeviceKind = 'mobile' | 'tablet' | 'laptop';

/**
 * Exposes a signal-based view of the current device kind, derived from
 * Angular CDK BreakpointObserver. Used to drive layout decisions for
 * mobile (< 600px), tablet (600-1023px) and laptop (>= 1024px).
 */
@Injectable({ providedIn: 'root' })
export class LayoutService {
  private readonly bp = inject(BreakpointObserver);

  readonly device = toSignal(
    this.bp
      .observe([Breakpoints.XSmall, Breakpoints.Small, Breakpoints.Medium])
      .pipe(
        map((state): DeviceKind => {
          if (state.breakpoints[Breakpoints.XSmall]) return 'mobile';
          if (state.breakpoints[Breakpoints.Small]) return 'tablet';
          return 'laptop';
        }),
      ),
    { initialValue: 'mobile' as DeviceKind },
  );

  readonly isMobile = computed(() => this.device() === 'mobile');
  readonly isTablet = computed(() => this.device() === 'tablet');
  readonly isLaptop = computed(() => this.device() === 'laptop');
}
