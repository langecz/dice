import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CurrentGame } from './current-game';
import { GameStore } from '../../../services/game.store';
import { DialogService } from '../../../services/dialog.service';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';

describe('CurrentGame', () => {
  let component: CurrentGame;
  let fixture: ComponentFixture<CurrentGame>;
  let mockStore: any;
  let mockDialog: any;

  beforeEach(async () => {
    mockStore = {
      state: () => ({
        currentGame: [],
        currentRound: [
          { playerId: '1', playerName: 'Player 1', points: 100 }
        ],
        teams: [],
        players: [{ id: '1', name: 'Player 1' }]
      }),
      updateLastRoll: vi.fn()
    };

    mockDialog = {
      open: vi.fn().mockReturnValue({
        afterClosed: () => of(200)
      })
    };

    await TestBed.configureTestingModule({
      imports: [CurrentGame],
      providers: [
        { provide: GameStore, useValue: mockStore },
        { provide: DialogService, useValue: mockDialog }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CurrentGame);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display player name and points', () => {
    const playerName = fixture.debugElement.query(By.css('.text-bold')).nativeElement;
    const points = fixture.debugElement.query(By.css('.text-secondary span')).nativeElement;

    expect(playerName.textContent).toContain('Player 1');
    expect(points.textContent).toContain('100 points');
  });

  it('should open dialog when edit button is clicked', () => {
    const editBtn = fixture.debugElement.query(By.css('button[aria-label="Edit points"]'));
    editBtn.nativeElement.click();

    expect(mockDialog.open).toHaveBeenCalled();
    expect(mockStore.updateLastRoll).toHaveBeenCalledWith('1', 200);
  });

  it('should apply player-item class to list items', () => {
    const listItem = fixture.debugElement.query(By.css('mat-list-item'));
    expect(listItem.nativeElement.classList.contains('player-item')).toBe(true);
  });
});
