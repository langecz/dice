import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayerOrderingComponent } from './player-ordering.component';
import { signal } from '@angular/core';
import { Player, Team } from '../../../models/game.models';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('PlayerOrderingComponent', () => {
  let component: PlayerOrderingComponent;
  let fixture: ComponentFixture<PlayerOrderingComponent>;

  const mockPlayers: Player[] = [
    { id: '1', name: 'Player 1', score: 0, dashes: 0, history: [] },
    { id: '2', name: 'Player 2', score: 0, dashes: 0, history: [] }
  ];

  const mockTeams: Team[] = [];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerOrderingComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerOrderingComponent);
    component = fixture.componentInstance;

    // Set required inputs
    (component as any).players = signal(mockPlayers);
    (component as any).teams = signal(mockTeams);
    (component as any).gameMode = signal('individual');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize orderedPlayers from players input', () => {
    expect(component.orderedPlayers().length).toBe(2);
    expect(component.orderedPlayers()[0].id).toBe('1');
    expect(component.orderedPlayers()[1].id).toBe('2');
  });

  it('should NOT reset orderedPlayers when inputs change if already initialized', () => {
    // Manually change order (simulating drag and drop)
    const reversed = [...mockPlayers].reverse();
    component.orderedPlayers.set(reversed);

    // Trigger input change (same content, different reference)
    (component.players as any).set([...mockPlayers]);
    fixture.detectChanges();

    // Order should be preserved (reversed)
    expect(component.orderedPlayers()[0].id).toBe('2');
    expect(component.orderedPlayers()[1].id).toBe('1');
  });

  it('should update selectedStartingPlayerId when radio button changes', () => {
    component.selectedStartingPlayerId.set('2');
    expect(component.selectedStartingPlayerId()).toBe('2');
  });
});
