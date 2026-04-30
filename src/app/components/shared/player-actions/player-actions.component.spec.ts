import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';import { PlayerActionsComponent } from './player-actions.component';
import { DialogService } from '../../../services/dialog.service';
import { Player, Team } from '../../../models/game.models';

const makePlayer = (id: string, name: string): Player => ({
  id, name, score: 0, dashes: 0, history: [],
});

const makeTeam = (id: string, playerIds: string[]): Team => ({
  id, name: `Team ${id}`, playerIds, score: 0, dashes: 0, history: [],
});

describe('PlayerActionsComponent', () => {
  let component: PlayerActionsComponent;
  let fixture: ComponentFixture<PlayerActionsComponent>;
  let dialogService: { open: ReturnType<typeof vi.fn> };
  let afterClosedSubject: Subject<unknown>;

  const player1 = makePlayer('p1', 'Alice');
  const player2 = makePlayer('p2', 'Bob');

  beforeEach(async () => {
    afterClosedSubject = new Subject<unknown>();
    dialogService = {
      open: vi.fn().mockReturnValue({
        afterClosed: () => afterClosedSubject.asObservable(),
      } as Partial<MatDialogRef<unknown>>),
    };

    await TestBed.configureTestingModule({
      imports: [PlayerActionsComponent],
      providers: [
        { provide: DialogService, useValue: dialogService },
        { provide: MatSnackBar, useValue: { open: vi.fn().mockReturnValue({}) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerActionsComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('player', player1);
    fixture.componentRef.setInput('players', signal([player1, player2]));
    fixture.detectChanges();
  });

  /**
   * Verifies the component is created successfully.
   */
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /**
   * Verifies the player name is rendered in the template.
   */
  it('should display the player name', () => {
    const nameEl: HTMLElement = fixture.nativeElement.querySelector('.player-name');
    expect(nameEl.textContent?.trim()).toBe('Alice');
  });

  /**
   * Verifies that handleEdit opens the edit dialog.
   */
  it('should open the edit dialog when handleEdit is called', () => {
    component.handleEdit();
    expect(dialogService.open).toHaveBeenCalledOnce();
  });

  /**
   * Verifies that confirming the edit dialog updates the player's name in the signal.
   */
  it('should update player name on confirmed edit', () => {
    const playersSignal = signal([player1, player2]);
    fixture.componentRef.setInput('players', playersSignal);
    fixture.detectChanges();

    component.handleEdit();
    afterClosedSubject.next('Alice Updated');

    expect(playersSignal().find(p => p.id === 'p1')?.name).toBe('Alice Updated');
  });

  /**
   * Verifies that cancelling the edit dialog (null result) leaves the players unchanged.
   */
  it('should not update player name when edit dialog is cancelled', () => {
    const playersSignal = signal([player1, player2]);
    fixture.componentRef.setInput('players', playersSignal);
    fixture.detectChanges();

    component.handleEdit();
    afterClosedSubject.next(null);

    expect(playersSignal().find(p => p.id === 'p1')?.name).toBe('Alice');
  });

  /**
   * Verifies that a duplicate name is rejected — the player name stays unchanged.
   */
  it('should reject duplicate player name on edit', () => {
    const playersSignal = signal([player1, player2]);
    fixture.componentRef.setInput('players', playersSignal);
    fixture.detectChanges();

    component.handleEdit();
    afterClosedSubject.next('Bob'); // duplicate of player2

    // Name must remain 'Alice' — duplicate rejected
    expect(playersSignal().find(p => p.id === 'p1')?.name).toBe('Alice');
    // Bob still has his name
    expect(playersSignal().find(p => p.id === 'p2')?.name).toBe('Bob');
  });

  /**
   * Verifies that handleDelete opens the confirm dialog.
   */
  it('should open the confirm dialog when handleDelete is called', () => {
    component.handleDelete();
    expect(dialogService.open).toHaveBeenCalledOnce();
  });

  /**
   * Verifies that confirming deletion removes the player from the signal.
   */
  it('should remove player from players signal on confirmed delete', () => {
    const playersSignal = signal([player1, player2]);
    fixture.componentRef.setInput('players', playersSignal);
    fixture.detectChanges();

    component.handleDelete();
    afterClosedSubject.next(true);

    expect(playersSignal().find(p => p.id === 'p1')).toBeUndefined();
    expect(playersSignal().length).toBe(1);
  });

  /**
   * Verifies that cancelling deletion leaves the players signal unchanged.
   */
  it('should not remove player when delete dialog is cancelled', () => {
    const playersSignal = signal([player1, player2]);
    fixture.componentRef.setInput('players', playersSignal);
    fixture.detectChanges();

    component.handleDelete();
    afterClosedSubject.next(false);

    expect(playersSignal().length).toBe(2);
  });

  /**
   * Verifies that deleting a player also cleans up team rosters when teams signal is provided.
   */
  it('should remove player from teams roster on delete when teams signal is provided', () => {
    const playersSignal = signal([player1, player2]);
    const teamsSignal = signal([makeTeam('t1', ['p1', 'p2']), makeTeam('t2', ['p1'])]);
    fixture.componentRef.setInput('players', playersSignal);
    fixture.componentRef.setInput('teams', teamsSignal);
    fixture.detectChanges();

    component.handleDelete();
    afterClosedSubject.next(true);

    expect(teamsSignal().find(t => t.id === 't1')?.playerIds).not.toContain('p1');
    expect(teamsSignal().find(t => t.id === 't2')?.playerIds).not.toContain('p1');
    expect(teamsSignal().find(t => t.id === 't1')?.playerIds).toContain('p2');
  });

  /**
   * Verifies that deletion without teams signal does not throw.
   */
  it('should delete without errors when no teams signal is provided', () => {
    const playersSignal = signal([player1, player2]);
    fixture.componentRef.setInput('players', playersSignal);
    fixture.detectChanges();
    // teams input defaults to null

    component.handleDelete();
    expect(() => afterClosedSubject.next(true)).not.toThrow();
    expect(playersSignal().length).toBe(1);
  });
});





