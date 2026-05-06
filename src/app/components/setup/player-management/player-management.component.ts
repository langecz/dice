import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  WritableSignal,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { GameStore } from '../../../services/game.store';
import { Player, Team } from '../../../models/game.models';
import { generateUniqueId } from '../../../utils/uuid';
import { SnackbarService } from '../../../services/snackbar.service';
import { PlayerActionsComponent } from '../../shared/player-actions/player-actions.component';
import { TeamActionsComponent } from '../../shared/team-actions/team-actions.component';
import { HasUnsavedChanges } from '../../../interfaces/unsaved-changes.interface';
@Component({
  selector: 'app-player-management',
  imports: [
    PlayerActionsComponent,
    TeamActionsComponent,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
  ],
  templateUrl: './player-management.component.html',
  styleUrl: './player-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerManagementComponent implements HasUnsavedChanges {
  private readonly store = inject(GameStore);
  private readonly router = inject(Router);
  private readonly snackbarService = inject(SnackbarService);

  readonly gameMode = this.store.gameMode;
  readonly players: WritableSignal<Player[]> = linkedSignal<Player[]>(() => [...this.store.players()]);
  readonly teams: WritableSignal<Team[]> = linkedSignal<Team[]>(() => [...this.store.teams()]);

  readonly hasUnsavedChanges = computed(() => {

    /*
    * complex check used, instead of just dirty and touched check
    *  - It checks if the number of players/teams has changed.
    *  - It checks if any names have been modified.
    *  - It checks if the composition of teams (playerIds) has changed.
    * */

    const originalPlayers = this.store.players();
    const currentPlayers = this.players();
    const originalTeams = this.store.teams();
    const currentTeams = this.teams();

    if (originalPlayers.length !== currentPlayers.length || originalTeams.length !== currentTeams.length) {
      return true;
    }

    const playersChanged = currentPlayers.some((p, i) =>
      p.id !== originalPlayers[i].id || p.name !== originalPlayers[i].name
    );
    if (playersChanged) return true;

    return currentTeams.some((t, i) =>
      t.id !== originalTeams[i].id ||
      t.name !== originalTeams[i].name ||
      t.playerIds.length !== originalTeams[i].playerIds.length ||
      t.playerIds.some((id, j) => id !== originalTeams[i].playerIds[j])
    );
  });

  addPlayer(name: string, teamId?: string): void {
    const trimmedName = name.trim();
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

    this.players.update(ps => [...ps, newPlayer]);

    if (this.gameMode() === 'team' && teamId) {
      this.teams.update(ts => ts.map(t =>
        t.id === teamId ? { ...t, playerIds: [...t.playerIds, newPlayer.id] } : t
      ));
    }
  }


  addTeam(name: string): void {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    if (this.teams().some(t => t.name.toLowerCase() === trimmedName.toLowerCase())) {
      this.snackbarService.showError(`Team "${trimmedName}" already exists`);
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

    this.teams.update(ts => [...ts, newTeam]);
  }


  movePlayer(playerId: string, targetTeamId: string): void {
    this.teams.update(ts => ts.map(t => {
      if (t.id === targetTeamId) {
        if (!t.playerIds.includes(playerId)) {
          return { ...t, playerIds: [...t.playerIds, playerId] };
        }
      } else if (t.playerIds.includes(playerId)) {
        return { ...t, playerIds: t.playerIds.filter(id => id !== playerId) };
      }
      return t;
    }));
  }

  onSave(): void {
    this.store.updatePlayersAndTeams(this.players(), this.teams());
    void this.router.navigate(['/ordering']);
  }

  getPlayerById(id: string): Player | undefined {
    return this.players().find(p => p.id === id);
  }
}
