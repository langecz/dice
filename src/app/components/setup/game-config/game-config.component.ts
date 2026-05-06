import {
  Component,
  computed,
  linkedSignal,
  ChangeDetectionStrategy,
  WritableSignal,
  Signal,
  inject,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatRadioModule } from '@angular/material/radio';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { form } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { generateUniqueId } from '../../../utils/uuid';
import { GameMode, Player, Team } from '../../../models/game.models';
import { toSignalMap } from '../../../utils/signal-map';
import { GameStore } from '../../../services/game.store';
import { SnackbarService } from '../../../services/snackbar.service';
import { PlayerActionsComponent } from '../../shared/player-actions/player-actions.component';
import { TeamActionsComponent } from '../../shared/team-actions/team-actions.component';

@Component({
  selector: 'app-game-config',
  imports: [
    PlayerActionsComponent,
    TeamActionsComponent,
    MatCardModule,
    MatExpansionModule,
    MatRadioModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSnackBarModule,
  ],
  templateUrl: './game-config.component.html',
  styleUrl: './game-config.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameConfigComponent {

  private readonly snackbarService = inject(SnackbarService);
  private readonly store = inject(GameStore);
  private readonly router = inject(Router);

  // Local working state, seeded from (and re-synced with) the store. Persisted back via NEXT.
  // Reading store.applicationState().resetId inside each computation ensures the linkedSignal
  // resets even when the actual data values haven't changed (e.g. reset while still at default state).
  players: WritableSignal<Player[]> = linkedSignal<Player[]>(() => {
    this.store.applicationState().resetId; // track reset events
    return [...this.store.players()];
  });
  teams: WritableSignal<Team[]> = linkedSignal<Team[]>(() => {
    this.store.applicationState().resetId; // track reset events
    return [...this.store.teams()];
  });

  playerMap: Signal<Map<string, Player>> = toSignalMap(this.players, player => player.id);

  setupModel = linkedSignal(() => {
    this.store.applicationState().resetId; // track reset events
    return {
      gameMode: this.store.gameMode() as GameMode,
      targetPoints: this.store.targetPoints(),
      minPointsPerTurn: this.store.minPointsPerTurn(),
    };
  });

  setupForm = form(this.setupModel);

  canNext = computed(() => {
    if (this.setupForm.gameMode().value() === 'individual') {
      return this.players().length >= 2;
    } else {
      return this.teams().length >= 2 && this.teams().every(t => t.playerIds.length >= 1);
    }
  });

  addItem(name: string): void {
    const trimmedName = name?.trim();
    if (!trimmedName) return;

    if (this.setupForm.gameMode().value() === 'individual') {
      const players = this.players();
      if (players.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
        this.snackbarService.showError(`Player "${trimmedName}" already exists`)
        return;
      }
      const newPlayer: Player = {
        id: generateUniqueId(),
        name: trimmedName,
        score: 0,
        dashes: 0,
        history: [],
        wins: 0
      };
      this.players.update(p => [...p, newPlayer]);
    } else {
      const teams = this.teams();
      if (teams.some(t => t.name.toLowerCase() === trimmedName.toLowerCase())) {
        this.snackbarService.showError(`Team "${trimmedName}" already exists`)
        return;
      }
      const newTeam: Team = {
        id: generateUniqueId(),
        name: trimmedName,
        playerIds: [],
        score: 0,
        dashes: 0,
        history: [],
        wins: 0
      };
      this.teams.update(t => [...t, newTeam]);
    }
  }

  addPlayerToTeam(teamId: string, playerName: string): void {
    const trimmedName = playerName?.trim();
    if (!trimmedName) return;

    if (this.players().some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
      this.snackbarService.showError(`Player "${trimmedName}" already exists`);
      return;
    }

    const newPlayer: Player = {
      id: generateUniqueId(),
      name: trimmedName,
      score: 0,
      dashes: 0,
      history: [],
      wins: 0
    };
    this.players.update(p => [...p, newPlayer]);
    this.teams.update(teams => teams.map(t =>
      t.id === teamId ? { ...t, playerIds: [...t.playerIds, newPlayer.id] } : t
    ));
  }



  onNext(): void {
    if (!this.canNext()) {
      return;
    }
    this.store.setConfig({
      gameMode: this.setupForm.gameMode().value(),
      targetPoints: this.setupForm.targetPoints().value(),
      minPointsPerTurn: this.setupForm.minPointsPerTurn().value(),
    });
    this.store.updatePlayersAndTeams(this.players(), this.teams());
    void this.router.navigate(['/ordering']);
  }
}
