import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameConfigComponent } from './game-config.component';
import { provideRouter } from '@angular/router';
import { SnackbarService } from '../../../services/snackbar.service';

describe('GameConfigComponent', () => {
  let component: GameConfigComponent;
  let fixture: ComponentFixture<GameConfigComponent>;
  let mockSnackbarService: any;

  beforeEach(async () => {
    // Reset persisted state so the store starts fresh per test
    localStorage.clear();

    mockSnackbarService = {
      showError: vi.fn(),
      showSuccess: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [GameConfigComponent],
      providers: [
        provideRouter([]),
        {
          provide: SnackbarService,
          useValue: mockSnackbarService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GameConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /**
   * Verifies the component is created.
   */
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  /**
   * Verifies that duplicate player names are not allowed in individual mode.
   */
  it('should not allow duplicate player names in individual mode', () => {
    component.addItem('Alice');
    expect(component.players().length).toBe(1);

    component.addItem('Alice');
    expect(component.players().length).toBe(1);
  });

  /**
   * Verifies that duplicate team names are not allowed in team mode.
   */
  it('should not allow duplicate team names in team mode', () => {
    component.setupForm.gameMode().value.set('team');

    component.addItem('Team Alpha');
    expect(component.teams().length).toBe(1);

    component.addItem('Team Alpha');
    expect(component.teams().length).toBe(1);
  });

  /**
   * Verifies that duplicate player names are not allowed when adding to teams.
   */
  it('should not allow duplicate player names when adding to teams', () => {
    component.setupForm.gameMode().value.set('team');

    component.addItem('Team Alpha');
    const teamId = component.teams()[0].id;

    component.addPlayerToTeam(teamId, 'Alice');
    expect(component.players().length).toBe(1);

    component.addPlayerToTeam(teamId, 'Alice');
    expect(component.players().length).toBe(1);
  });

  /**
   * Verifies that empty names are not allowed for players.
   */
  it('should not allow empty player names', () => {
    component.setupForm.gameMode().value.set('individual');
    component.addItem('');
    expect(component.players().length).toBe(0);

    component.addItem('   ');
    expect(component.players().length).toBe(0);
  });
});
