import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayerManagementComponent } from './player-management.component';
import { GameStore } from '../../../services/game.store';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

describe('PlayerManagementComponent', () => {
  let component: PlayerManagementComponent;
  let fixture: ComponentFixture<PlayerManagementComponent>;
  let mockStore: any;

  beforeEach(async () => {
    mockStore = {
      gameMode: signal('individual'),
      players: signal([
        { id: '1', name: 'Player 1', score: 0, dashes: 0, history: [], wins: 0 },
      ]),
      teams: signal([]),
      updatePlayersAndTeams: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PlayerManagementComponent, BrowserAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: GameStore, useValue: mockStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /**
   * Verifies the component is instantiated successfully.
   */
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /**
   * Verifies adding a player in individual mode.
   */
  it('should add a player in individual mode', () => {
    component.addPlayer('New Player');
    expect(component.players().length).toBe(2);
    expect(component.players()[1].name).toBe('New Player');
  });

  /**
   * Verifies preventing duplicate player names.
   */
  it('should not add a duplicate player', () => {
    component.addPlayer('Player 1');
    expect(component.players().length).toBe(1);
  });

  /**
   * Verifies team mode operations: adding team and player to it.
   */
  it('should handle team mode operations', () => {
    mockStore.gameMode.set('team');
    mockStore.teams.set([{ id: 't1', name: 'Team 1', playerIds: [], score: 0, dashes: 0, history: [], wins: 0 }]);

    component.players.set([...mockStore.players()]);
    component.teams.set([...mockStore.teams()]);

    component.addTeam('Team 2');
    expect(component.teams().length).toBe(2);

    component.addPlayer('Team Player', 't1');
    expect(component.players().length).toBe(2);
    const team1 = component.teams().find(t => t.id === 't1');
    expect(team1?.playerIds.length).toBe(1);
  });

  /**
   * Verifies moving a player between teams.
   */
  it('should move player between teams', () => {
    const p1 = { id: 'p1', name: 'P1', score: 0, dashes: 0, history: [], wins: 0 };
    const t1 = { id: 't1', name: 'T1', playerIds: ['p1'], score: 0, dashes: 0, history: [], wins: 0 };
    const t2 = { id: 't2', name: 'T2', playerIds: [], score: 0, dashes: 0, history: [], wins: 0 };

    component.players.set([p1]);
    component.teams.set([t1, t2]);

    component.movePlayer('p1', 't2');

    expect(component.teams().find(t => t.id === 't1')?.playerIds).not.toContain('p1');
    expect(component.teams().find(t => t.id === 't2')?.playerIds).toContain('p1');
  });
});
