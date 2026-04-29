import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlayerOrderingComponent } from './player-ordering.component';
import { GameStore } from '../../../services/game.store';
import { provideRouter } from '@angular/router';
import { Player, Team } from '../../../models/game.models';

describe('PlayerOrderingComponent', () => {
  let component: PlayerOrderingComponent;
  let fixture: ComponentFixture<PlayerOrderingComponent>;
  let store: InstanceType<typeof GameStore>;

  const mockPlayers: Player[] = [
    { id: '1', name: 'Player 1', score: 0, dashes: 0, history: [] },
    { id: '2', name: 'Player 2', score: 0, dashes: 0, history: [] },
  ];

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [PlayerOrderingComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    store = TestBed.inject(GameStore);
    store.updatePlayersAndTeams(mockPlayers, [] as Team[]);

    fixture = TestBed.createComponent(PlayerOrderingComponent);
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
   * Verifies the initial ordered list mirrors the players from the store.
   */
  it('should initialize orderedPlayers from store players', () => {
    expect(component.orderedPlayers().length).toBe(2);
    expect(component.orderedPlayers()[0].id).toBe('1');
    expect(component.orderedPlayers()[1].id).toBe('2');
  });

  /**
   * Verifies selecting a starting player updates the corresponding signal.
   */
  it('should update selectedStartingPlayerId when changed', () => {
    component.selectedStartingPlayerId.set('2');
    expect(component.selectedStartingPlayerId()).toBe('2');
  });
});
