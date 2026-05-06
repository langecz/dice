import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MainPageComponent } from './main-page.component';
import { Router, NavigationEnd } from '@angular/router';
import { GameStore } from '../../services/game.store';
import { DialogService } from '../../services/dialog.service';
import { GameLogExportService } from '../../services/game-log-export';
import { signal } from '@angular/core';
import { Subject, of } from 'rxjs';
import { ResetGameConfirmDialogComponent } from '../shared/reset-game-confirm-dialog/reset-game-confirm-dialog.component';
import { ConfirmDialogComponent } from '../shared/confirm-dialog/confirm-dialog.component';

describe('MainPageComponent', () => {
  let component: MainPageComponent;
  let fixture: ComponentFixture<MainPageComponent>;
  let mockRouter: any;
  let mockGameStore: any;
  let mockDialogService: any;
  let mockGameLogExportService: any;
  let routerEvents: Subject<any>;

  beforeEach(async () => {
    routerEvents = new Subject();
    mockRouter = {
      events: routerEvents.asObservable(),
      url: '/setup',
      navigate: vi.fn().mockResolvedValue(true),
    };

    mockGameStore = {
      gameHistory: signal([]),
      resetGame: vi.fn(),
    };

    mockDialogService = {
      open: vi.fn(),
    };

    mockGameLogExportService = {
      saveGameLog: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [MainPageComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: GameStore, useValue: mockGameStore },
        { provide: DialogService, useValue: mockDialogService },
        { provide: GameLogExportService, useValue: mockGameLogExportService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MainPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct title for setup phase', () => {
    expect(component.phase().title).toBe('Game Setup');
  });

  it('should change phase when URL changes', () => {
    routerEvents.next(new NavigationEnd(1, '/ordering', '/ordering'));
    fixture.detectChanges();
    expect(component.phase().title).toBe('Player Ordering');
  });

  it('should navigate to /management on manage-players action', () => {
    component.onAction('manage-players');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/management']);
  });

  it('should navigate to /history on view-log action', () => {
    component.onAction('view-log');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/history']);
  });

  it('should open confirm reset dialog on reset action', () => {
    const mockDialogRef = {
      afterClosed: () => of(undefined),
    };
    mockDialogService.open.mockReturnValue(mockDialogRef);

    component.onAction('reset');
    expect(mockDialogService.open).toHaveBeenCalledWith(ResetGameConfirmDialogComponent, expect.any(Object));
  });

  it('should call resetGame(false) and navigate to /setup when reset dialog is confirmed with reset', async () => {
    const mockDialogRef = {
      afterClosed: () => of('reset'),
    };
    mockDialogService.open.mockReturnValue(mockDialogRef);

    component.onAction('reset');
    // We need to wait for the microtask because handleResetDialogResult is async
    await fixture.whenStable();

    expect(mockGameStore.resetGame).toHaveBeenCalledWith(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/setup']);
  });

  it('should NOT call resetGame(false) and NOT navigate to /setup when reset dialog is closed with cancel or undefined', async () => {
    const mockDialogRef = {
      afterClosed: () => of('cancel'),
    };
    mockDialogService.open.mockReturnValue(mockDialogRef);

    component.onAction('reset');
    await fixture.whenStable();

    expect(mockGameStore.resetGame).not.toHaveBeenCalled();
    expect(mockRouter.navigate).not.toHaveBeenCalledWith(['/setup']);
  });

  it('should open confirm new game dialog on new-game action', () => {
    const mockDialogRef = {
      afterClosed: () => of(undefined),
    };
    mockDialogService.open.mockReturnValue(mockDialogRef);

    component.onAction('new-game');
    expect(mockDialogService.open).toHaveBeenCalledWith(ConfirmDialogComponent, expect.any(Object));
  });

  it('should call resetGame(true) and navigate to /ordering when new game is confirmed', () => {
    const mockDialogRef = {
      afterClosed: () => of(true),
    };
    mockDialogService.open.mockReturnValue(mockDialogRef);

    component.onAction('new-game');
    expect(mockGameStore.resetGame).toHaveBeenCalledWith(true);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/ordering']);
  });
});
