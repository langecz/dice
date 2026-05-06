import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { TeamActionsComponent } from './team-actions.component';
import { DialogService } from '../../../services/dialog.service';
import { SnackbarService } from '../../../services/snackbar.service';
import { Player, Team } from '../../../models/game.models';

const makePlayer = (id: string, name: string): Player => ({
  id, name, score: 0, dashes: 0, history: [], wins: 0,
});

const makeTeam = (id: string, name: string, playerIds: string[] = []): Team => ({
  id, name, playerIds, score: 0, dashes: 0, history: [], wins: 0,
});

describe('TeamActionsComponent', () => {
  let component: TeamActionsComponent;
  let fixture: ComponentFixture<TeamActionsComponent>;
  let dialogService: { open: ReturnType<typeof vi.fn> };
  let mockSnackbarService: any;
  let afterClosedSubject: Subject<unknown>;

  const team1 = makeTeam('t1', 'Alpha', ['p1', 'p2']);
  const team2 = makeTeam('t2', 'Beta');
  const player1 = makePlayer('p1', 'Alice');
  const player2 = makePlayer('p2', 'Bob');

  beforeEach(async () => {
    afterClosedSubject = new Subject<unknown>();
    dialogService = {
      open: vi.fn().mockReturnValue({
        afterClosed: () => afterClosedSubject.asObservable(),
      } as Partial<MatDialogRef<unknown>>),
    };

    mockSnackbarService = {
      showError: vi.fn(),
      showSuccess: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [TeamActionsComponent],
      providers: [
        { provide: DialogService, useValue: dialogService },
        { provide: SnackbarService, useValue: mockSnackbarService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamActionsComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('team', team1);
    fixture.componentRef.setInput('teams', signal([team1, team2]));
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
   * Verifies that handleEdit opens the edit dialog.
   */
  it('should open the edit dialog when handleEdit is called', () => {
    component.handleEdit();
    expect(dialogService.open).toHaveBeenCalledOnce();
  });

  /**
   * Verifies that confirming the edit dialog updates the team name.
   */
  it('should update team name on confirmed edit', () => {
    const teamsSignal = signal([team1, team2]);
    fixture.componentRef.setInput('teams', teamsSignal);
    fixture.detectChanges();

    component.handleEdit();
    afterClosedSubject.next('Alpha Updated');

    expect(teamsSignal().find(t => t.id === 't1')?.name).toBe('Alpha Updated');
  });

  /**
   * Verifies that cancelling the edit dialog leaves teams unchanged.
   */
  it('should not update team name when edit is cancelled', () => {
    const teamsSignal = signal([team1, team2]);
    fixture.componentRef.setInput('teams', teamsSignal);
    fixture.detectChanges();

    component.handleEdit();
    afterClosedSubject.next(null);

    expect(teamsSignal().find(t => t.id === 't1')?.name).toBe('Alpha');
  });

  /**
   * Verifies that a duplicate team name is rejected — team name stays unchanged.
   */
  it('should reject duplicate team name on edit', () => {
    const teamsSignal = signal([team1, team2]);
    fixture.componentRef.setInput('teams', teamsSignal);
    fixture.detectChanges();

    component.handleEdit();
    afterClosedSubject.next('Beta'); // duplicate of team2

    // Name must remain 'Alpha' — duplicate rejected
    expect(teamsSignal().find(t => t.id === 't1')?.name).toBe('Alpha');
    expect(teamsSignal().find(t => t.id === 't2')?.name).toBe('Beta');
  });

  /**
   * Verifies that handleDelete opens the confirm dialog.
   */
  it('should open the confirm dialog when handleDelete is called', () => {
    component.handleDelete();
    expect(dialogService.open).toHaveBeenCalledOnce();
  });

  /**
   * Verifies that confirming deletion removes the team from the signal.
   */
  it('should remove team from teams signal on confirmed delete', () => {
    const teamsSignal = signal([team1, team2]);
    fixture.componentRef.setInput('teams', teamsSignal);
    fixture.detectChanges();

    component.handleDelete();
    afterClosedSubject.next(true);

    expect(teamsSignal().find(t => t.id === 't1')).toBeUndefined();
    expect(teamsSignal().length).toBe(1);
  });

  /**
   * Verifies that cancelling deletion leaves the teams signal unchanged.
   */
  it('should not remove team when delete is cancelled', () => {
    const teamsSignal = signal([team1, team2]);
    fixture.componentRef.setInput('teams', teamsSignal);
    fixture.detectChanges();

    component.handleDelete();
    afterClosedSubject.next(false);

    expect(teamsSignal().length).toBe(2);
  });

  /**
   * Verifies that all players belonging to the deleted team are also removed from the players signal.
   */
  it('should remove team players from players signal on confirmed delete', () => {
    const teamsSignal = signal([team1, team2]);
    const playersSignal = signal([player1, player2]);
    fixture.componentRef.setInput('teams', teamsSignal);
    fixture.componentRef.setInput('players', playersSignal);
    fixture.detectChanges();

    component.handleDelete(); // team1 has ['p1','p2']
    afterClosedSubject.next(true);

    expect(playersSignal().find(p => p.id === 'p1')).toBeUndefined();
    expect(playersSignal().find(p => p.id === 'p2')).toBeUndefined();
    expect(playersSignal().length).toBe(0);
  });
});

