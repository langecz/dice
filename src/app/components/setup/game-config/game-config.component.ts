import {
  Component,
  signal,
  computed,
  ChangeDetectionStrategy,
  output,
  input,
  InputSignal,
  WritableSignal, effect, Signal
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { form } from '@angular/forms/signals';
import { generateUniqueId } from '../../../utils/uuid';
import { GameMode, Player, Team } from '../../../models/game.models';
import { DEFAULT_MIN_POINTS_PER_TURN, DEFAULT_TARGET_POINTS } from '../../../constants/game.constants';
import { GameConfig } from '../../../models/config.model';
import { toSignalMap } from '../../../utils/signal-map';

@Component({
  selector: 'app-game-config',
  imports: [
    MatCardModule,
    MatExpansionModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
  ],
  templateUrl: './game-config.component.html',
  styleUrl: './game-config.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameConfigComponent {
  initialPlayers: InputSignal<Player[]> = input<Player[]>([]);
  initialTeams: InputSignal<Team[]> = input<Team[]>([]);
  initialConfig: InputSignal<GameConfig> = input<GameConfig>({
    gameMode: 'individual',
    targetPoints: DEFAULT_TARGET_POINTS,
    minPointsPerTurn: DEFAULT_MIN_POINTS_PER_TURN
  });

  configComplete = output<{
    players: Player[];
    teams: Team[];
    config: GameConfig;
  }>();

  players: WritableSignal<Player[]> = signal<Player[]>([]);
  teams: WritableSignal<Team[]> = signal<Team[]>([]);

  playerMap: Signal<Map<string, Player>> = toSignalMap(this.players, player => player.id);

  setupModel = signal({
    gameMode: 'individual' as GameMode,
    targetPoints: DEFAULT_TARGET_POINTS,
    minPointsPerTurn: DEFAULT_MIN_POINTS_PER_TURN
  });

  setupForm = form(this.setupModel);

  constructor() {
    effect(() => {

      const initialPlayers = this.initialPlayers();
      const initialTeams = this.initialTeams();
      const initialConfig = this.initialConfig();

      if (initialPlayers?.length > 0) {
        this.players.set(this.initialPlayers());
      }

      if (initialTeams?.length > 0) {
        this.teams.set(this.initialTeams());
      }

      this.setupModel.set(initialConfig);
    });
  }

  canNext = computed(() => {
    if (this.setupForm.gameMode().value() === 'individual') {
      return this.players().length >= 2;
    } else {
      return this.teams().length >= 2 && this.teams().every(t => t.playerIds.length >= 1);
    }
  });

  addItem(name: string): void {
    if (!name) return;
    if (this.setupForm.gameMode().value() === 'individual') {
      const newPlayer: Player = {
        id: generateUniqueId(),
        name,
        score: 0,
        dashes: 0,
        history: []
      };
      this.players.update(p => [...p, newPlayer]);
    } else {
      const newTeam: Team = {
        id: generateUniqueId(),
        name,
        playerIds: [],
        score: 0,
        dashes: 0,
        history: []
      };
      this.teams.update(t => [...t, newTeam]);
    }
  }

  removeItem(id: string): void {
    if (this.setupForm.gameMode().value() === 'individual') {
      this.players.update(p => p.filter(x => x.id !== id));
    } else {
      const team = this.teams().find(t => t.id === id);
      if (team) {
        const pids = team.playerIds;
        this.teams.update(t => t.filter(x => x.id !== id));
        this.players.update(p => p.filter(x => !pids.includes(x.id)));
      }
    }
  }

  addPlayerToTeam(teamId: string, playerName: string): void {
    if (!playerName) return;
    const newPlayer: Player = {
      id: generateUniqueId(),
      name: playerName,
      score: 0,
      dashes: 0,
      history: []
    };
    this.players.update(p => [...p, newPlayer]);
    this.teams.update(teams => teams.map(t =>
      t.id === teamId ? { ...t, playerIds: [...t.playerIds, newPlayer.id] } : t
    ));
  }

  removePlayerFromTeam(teamId: string, playerId: string): void {
    this.teams.update(teams => teams.map(t =>
      t.id === teamId ? { ...t, playerIds: t.playerIds.filter(pid => pid !== playerId) } : t
    ));
    this.players.update(p => p.filter(x => x.id !== playerId));
  }

  onNext() {
    if (this.canNext()) {
      this.configComplete.emit({
        players: this.players(),
        teams: this.teams(),
        config: {
          gameMode: this.setupForm.gameMode().value(),
          targetPoints: this.setupForm.targetPoints().value(),
          minPointsPerTurn: this.setupForm.minPointsPerTurn().value()
        }
      });
    }
  }
}
