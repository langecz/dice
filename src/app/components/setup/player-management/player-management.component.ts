import {
  ChangeDetectionStrategy,
  Component,
  inject,
  linkedSignal,
  WritableSignal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { GameStore } from '../../../services/game.store';
import { Player, Team } from '../../../models/game.models';
import { generateUniqueId } from '../../../utils/uuid';
import { showSnackbarError } from '../../../utils/snackbar';
import { DialogService } from '../../../services/dialog.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { EditNameDialogComponent, EditNameDialogData } from '../../shared/edit-name-dialog/edit-name-dialog.component';

@Component({
  selector: 'app-player-management',
  imports: [
    CommonModule,
    MatButtonModule,
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
export class PlayerManagementComponent {
  private readonly store = inject(GameStore);
  private readonly router = inject(Router);
  private readonly dialog = inject(DialogService);
  private readonly snackBar = inject(MatSnackBar);

  readonly gameMode = this.store.gameMode;
  readonly players: WritableSignal<Player[]> = linkedSignal<Player[]>(() => [...this.store.players()]);
  readonly teams: WritableSignal<Team[]> = linkedSignal<Team[]>(() => [...this.store.teams()]);

  addPlayer(name: string, teamId?: string): void {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    if (this.players().some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
      showSnackbarError(this.snackBar, `Player "${trimmedName}" already exists`);
      return;
    }

    const newPlayer: Player = {
      id: generateUniqueId(),
      name: trimmedName,
      score: 0,
      dashes: 0,
      history: [],
    };

    this.players.update(ps => [...ps, newPlayer]);

    if (this.gameMode() === 'team' && teamId) {
      this.teams.update(ts => ts.map(t =>
        t.id === teamId ? { ...t, playerIds: [...t.playerIds, newPlayer.id] } : t
      ));
    }
  }

  editPlayer(player: Player): void {
    const dialogRef = this.dialog.open<EditNameDialogComponent, EditNameDialogData, string | null>(EditNameDialogComponent, {
      data: {
        title: 'Edit Player',
        label: 'Player name',
        currentName: player.name,
        confirmText: 'Save',
        cancelText: 'Cancel',
      } satisfies EditNameDialogData,
    });

    dialogRef.afterClosed().subscribe(newName => {
      if (newName && newName.trim()) {
        const trimmed = newName.trim();
        if (this.players().some(p => p.id !== player.id && p.name.toLowerCase() === trimmed.toLowerCase())) {
          showSnackbarError(this.snackBar, `Player "${trimmed}" already exists`);
          return;
        }
        this.players.update(ps => ps.map(p => p.id === player.id ? { ...p, name: trimmed } : p));
      }
    });
  }

  removePlayer(playerId: string): void {
    const player = this.players().find(p => p.id === playerId);
    if (!player) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Player',
        message: `Are you sure you want to delete player "${player.name}"?`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.players.update(ps => ps.filter(p => p.id !== playerId));
        if (this.gameMode() === 'team') {
          this.teams.update(ts => ts.map(t => ({
            ...t,
            playerIds: t.playerIds.filter(id => id !== playerId)
          })));
        }
      }
    });
  }

  addTeam(name: string): void {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    if (this.teams().some(t => t.name.toLowerCase() === trimmedName.toLowerCase())) {
      showSnackbarError(this.snackBar, `Team "${trimmedName}" already exists`);
      return;
    }

    const newTeam: Team = {
      id: generateUniqueId(),
      name: trimmedName,
      playerIds: [],
      score: 0,
      dashes: 0,
      history: [],
    };

    this.teams.update(ts => [...ts, newTeam]);
  }

  editTeam(team: Team): void {
    const dialogRef = this.dialog.open<EditNameDialogComponent, EditNameDialogData, string | null>(EditNameDialogComponent, {
      data: {
        title: 'Edit Team',
        label: 'Team name',
        currentName: team.name,
        confirmText: 'Save',
        cancelText: 'Cancel',
      } satisfies EditNameDialogData,
    });

    dialogRef.afterClosed().subscribe(newName => {
      if (newName && newName.trim()) {
        const trimmed = newName.trim();
        if (this.teams().some(t => t.id !== team.id && t.name.toLowerCase() === trimmed.toLowerCase())) {
          showSnackbarError(this.snackBar, `Team "${trimmed}" already exists`);
          return;
        }
        this.teams.update(ts => ts.map(t => t.id === team.id ? { ...t, name: trimmed } : t));
      }
    });
  }

  removeTeam(teamId: string): void {
    const team = this.teams().find(t => t.id === teamId);
    if (!team) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Team',
        message: `Are you sure you want to delete team "${team.name}" and all its players?`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        const playerIdsToRemove = team.playerIds;
        this.teams.update(ts => ts.filter(t => t.id !== teamId));
        this.players.update(ps => ps.filter(p => !playerIdsToRemove.includes(p.id)));
      }
    });
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

  onCancel(): void {
    void this.router.navigate(['/ordering']);
  }

  getPlayerById(id: string): Player | undefined {
    return this.players().find(p => p.id === id);
  }
}
