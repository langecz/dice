import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GamesLogComponent } from './games-log.component';
import { GameLogExportService } from '../../../services/game-log-export';
import { GameStore } from '../../../services/game.store';
import { signal } from '@angular/core';

describe('GamesLogComponent', () => {
  let component: GamesLogComponent;
  let fixture: ComponentFixture<GamesLogComponent>;
  let mockGameStore: any;
  let mockGameLogExportService: any;

  beforeEach(async () => {
    mockGameStore = {
      gameHistory: signal([]),
    };

    mockGameLogExportService = {
      saveGameLog: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [GamesLogComponent],
      providers: [
        { provide: GameStore, useValue: mockGameStore },
        { provide: GameLogExportService, useValue: mockGameLogExportService },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GamesLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Test that the save button is NOT visible when gameHistory is empty
  it('should not show the save button when game history is empty', () => {
    mockGameStore.gameHistory.set([]);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button[aria-label="Save game log"]');
    expect(button).toBeNull();
  });

  // Test that the save button IS visible when gameHistory is not empty
  it('should show the save button when game history is not empty', () => {
    mockGameStore.gameHistory.set([{ id: '1', winnerName: 'Player 1', finalScores: '100', timestamp: Date.now(), rounds: [] }]);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector('button[aria-label="Save game log"]');
    expect(button).toBeTruthy();
  });

  // Test that saveGameLog calls GameLogExportService.saveGameLog
  it('should call GameLogExportService.saveGameLog when saveGameLog is called', async () => {
    await component.saveGameLog();
    expect(mockGameLogExportService.saveGameLog).toHaveBeenCalled();
  });
});
