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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { form } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { generateUniqueId } from '../../../utils/uuid';
import { GameMode, Player, Team } from '../../../models/game.models';
import { toSignalMap } from '../../../utils/signal-map';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { EditNameDialogComponent, EditNameDialogData } from '../../shared/edit-name-dialog/edit-name-dialog.component';
import { showSnackbarError } from '../../../utils/snackbar';
import { DialogService } from '../../../services/dialog.service';
import { GameStore } from '../../../services/game.store';

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
    MatSnackBarModule,
  ],
  templateUrl: './game-config.component.html',
  styleUrl: './game-config.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GameConfigComponent {

  private readonly dialog: DialogService = inject(DialogService);
  private readonly snackBar: MatSnackBar = inject(MatSnackBar);
  private readonly store = inject(GameStore);
  private readonly router = inject(Router);

  // Local working state, seeded from (and re-synced with) the store. Persisted back via NEXT.
  // Using linkedSignal ensures the local state resets when the store changes (e.g. after Reset).
  players: WritableSignal<Player[]> = linkedSignal<Player[]>(() => [...this.store.players()]);
  teams: WritableSignal<Team[]> = linkedSignal<Team[]>(() => [...this.store.teams()]);

  playerMap: Signal<Map<string, Player>> = toSignalMap(this.players, player => player.id);

  setupModel = linkedSignal(() => ({
    gameMode: this.store.gameMode() as GameMode,
    targetPoints: this.store.targetPoints(),
    minPointsPerTurn: this.store.minPointsPerTurn(),
  }));

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
        showSnackbarError(this.snackBar, `Player "${trimmedName}" already exists`)
        return;
      }
      const newPlayer: Player = {
        id: generateUniqueId(),
        name: trimmedName,
        score: 0,
        dashes: 0,
        history: []
      };
      this.players.update(p => [...p, newPlayer]);
    } else {
      const teams = this.teams();
      if (teams.some(t => t.name.toLowerCase() === trimmedName.toLowerCase())) {
        showSnackbarError(this.snackBar, `Team "${trimmedName}" already exists`)
        return;
      }
      const newTeam: Team = {
        id: generateUniqueId(),
        name: trimmedName,
        playerIds: [],
        score: 0,
        dashes: 0,
        history: []
      };
      this.teams.update(t => [...t, newTeam]);
    }
  }

  removeItem(id: string): void {
    const isIndividual = this.setupForm.gameMode().value() === 'individual';
    const item = isIndividual
      ? this.players().find((p) => p.id === id)
      : this.teams().find((t) => t.id === id);

    if (!item) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: isIndividual ? 'Delete Player' : 'Delete Team',
        message: `Are you sure you want to delete ${isIndividual ? 'player' : 'team'} "${item.name}"?`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (isIndividual) {
          this.players.update((p) => p.filter((x) => x.id !== id));
        } else {
          const team = this.teams().find((t) => t.id === id);
          if (team) {
            const pids = team.playerIds;
            this.teams.update((t) => t.filter((x) => x.id !== id));
            this.players.update((p) => p.filter((x) => !pids.includes(x.id)));
          }
        }
      }
    });
  }

  addPlayerToTeam(teamId: string, playerName: string): void {
    const trimmedName = playerName?.trim();
    if (!trimmedName) return;

    if (this.players().some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
      this.snackBar.open(`Player "${trimmedName}" already exists`, 'Close', {
        duration: 3000,
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });
      return;
    }

    const newPlayer: Player = {
      id: generateUniqueId(),
      name: trimmedName,
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
    const player = this.players().find((p) => p.id === playerId);
    if (!player) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Player',
        message: `Are you sure you want to delete player "${player.name}"?`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.teams.update((teams) =>
          teams.map((t) =>
            t.id === teamId ? { ...t, playerIds: t.playerIds.filter((pid) => pid !== playerId) } : t,
          ),
        );
        this.players.update((p) => p.filter((x) => x.id !== playerId));
      }
    });
  }

  editPlayer(playerId: string): void {
    const player = this.playerMap().get(playerId);
    if (!player) {
      return;
    }

    const dialogRef = this.dialog.open<EditNameDialogComponent, EditNameDialogData, string | null>(EditNameDialogComponent, {
      data: {
        title: 'Edit Player',
        label: 'Player name',
        currentName: player.name,
        confirmText: 'Save',
        cancelText: 'Cancel',
      } satisfies EditNameDialogData,
    });

    dialogRef.afterClosed().subscribe((editedName: string | null | undefined) => {
      if (editedName === null || editedName === undefined) {
        return;
      }

      const nextName = editedName.trim();
      if (!nextName) {
        showSnackbarError(this.snackBar, 'Player name cannot be empty');
        return;
      }

      if (this.players().some(p => p.id !== playerId && p.name.toLowerCase() === nextName.toLowerCase())) {
        showSnackbarError(this.snackBar, `Player "${nextName}" already exists`);
        return;
      }

      this.players.update(players =>
        players.map(p => (p.id === playerId ? { ...p, name: nextName } : p))
      );
    });
  }

  editTeam(teamId: string): void {
    const team = this.teams().find(t => t.id === teamId);
    if (!team) {
      return;
    }

    const dialogRef = this.dialog.open<EditNameDialogComponent, EditNameDialogData, string | null>(EditNameDialogComponent, {
      data: {
        title: 'Edit Team',
        label: 'Team name',
        currentName: team.name,
        confirmText: 'Save',
        cancelText: 'Cancel',
      } satisfies EditNameDialogData,
    });

    dialogRef.afterClosed().subscribe((editedName: string | null | undefined) => {
      if (editedName === null || editedName === undefined) {
        return;
      }

      const nextName = editedName.trim();
      if (!nextName) {
        showSnackbarError(this.snackBar, 'Team name cannot be empty');
        return;
      }

      if (this.teams().some(t => t.id !== teamId && t.name.toLowerCase() === nextName.toLowerCase())) {
        showSnackbarError(this.snackBar, `Team "${nextName}" already exists`);
        return;
      }

      this.teams.update(teams =>
        teams.map(t => (t.id === teamId ? { ...t, name: nextName } : t))
      );
    });
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
