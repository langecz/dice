import { TestBed } from '@angular/core/testing';
import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { of } from 'rxjs';

import { LayoutService } from './layout.service';

/**
 * Builds a fake BreakpointObserver that emits a single state with the
 * provided active breakpoints set to true.
 */
function fakeObserver(active: string[]): Partial<BreakpointObserver> {
  const breakpoints: Record<string, boolean> = {};
  for (const key of [Breakpoints.XSmall, Breakpoints.Small, Breakpoints.Medium]) {
    breakpoints[key] = active.includes(key);
  }
  const state: BreakpointState = { matches: active.length > 0, breakpoints };
  return { observe: () => of(state) };
}

function setup(active: string[]): LayoutService {
  TestBed.configureTestingModule({
    providers: [
      { provide: BreakpointObserver, useValue: fakeObserver(active) },
    ],
  });
  return TestBed.inject(LayoutService);
}

describe('LayoutService', () => {
  afterEach(() => TestBed.resetTestingModule());

  // Verifies that the CDK XSmall breakpoint is mapped to the 'mobile' device kind.
  it('returns "mobile" when XSmall breakpoint matches', () => {
    const svc = setup([Breakpoints.XSmall]);
    expect(svc.device()).toBe('mobile');
    expect(svc.isMobile()).toBe(true);
    expect(svc.isTablet()).toBe(false);
    expect(svc.isLaptop()).toBe(false);
  });

  // Verifies that the CDK Small breakpoint is mapped to the 'tablet' device kind.
  it('returns "tablet" when Small breakpoint matches', () => {
    const svc = setup([Breakpoints.Small]);
    expect(svc.device()).toBe('tablet');
    expect(svc.isTablet()).toBe(true);
  });

  // Verifies that when neither XSmall nor Small match, the service falls back to 'laptop'.
  it('returns "laptop" when only Medium (or larger) matches', () => {
    const svc = setup([Breakpoints.Medium]);
    expect(svc.device()).toBe('laptop');
    expect(svc.isLaptop()).toBe(true);
  });

  // Verifies that XSmall takes precedence when multiple breakpoints somehow match.
  it('prioritises XSmall over Small/Medium when several match simultaneously', () => {
    const svc = setup([Breakpoints.XSmall, Breakpoints.Small]);
    expect(svc.device()).toBe('mobile');
  });
});
