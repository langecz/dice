import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GamesLogComponent } from './games-log.component';
import { GameStore } from '../../../services/game.store';
import { signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('GamesLogComponent', () => {
  let component: GamesLogComponent;
  let fixture: ComponentFixture<GamesLogComponent>;
  let mockGameStore: any;
  let mockSnackBar: any;

  beforeEach(async () => {
    mockGameStore = {
      gameHistory: signal([]),
      players: signal([]),
      teams: signal([]),
    };

    mockSnackBar = {
      open: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [GamesLogComponent],
      providers: [
        { provide: GameStore, useValue: mockGameStore },
        { provide: MatSnackBar, useValue: mockSnackBar },
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

  // Test that saveGameLog triggers showSaveFilePicker when available
  it('should use showSaveFilePicker when available', async () => {
    const mockWritable = {
      write: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
    };
    const mockHandle = {
      createWritable: vi.fn().mockResolvedValue(mockWritable),
    };
    const showSaveFilePickerSpy = vi.fn().mockResolvedValue(mockHandle);
    (window as any).showSaveFilePicker = showSaveFilePickerSpy;

    await component.saveGameLog();

    expect(showSaveFilePickerSpy).toHaveBeenCalled();
    expect(mockWritable.write).toHaveBeenCalled();
    expect(mockWritable.close).toHaveBeenCalled();

    delete (window as any).showSaveFilePicker;
  });

  // Test that saveGameLog fallbacks to direct download when showSaveFilePicker is not available
  it('should fallback to direct download when showSaveFilePicker is not available', async () => {
    delete (window as any).showSaveFilePicker;
    const createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:url');
    const revokeObjectURLSpy = vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    await component.saveGameLog();

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalled();
    // expect(mockSnackBar.open).toHaveBeenCalled();

    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
    clickSpy.mockRestore();
  });
});
