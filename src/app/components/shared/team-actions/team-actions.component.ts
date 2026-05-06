import { ChangeDetectionStrategy, Component, inject, input, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Team, Player } from '../../../models/game.models';
import { DialogService } from '../../../services/dialog.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { InputDialogComponent, InputDialogData } from '../input-dialog/input-dialog.component';
import { SnackbarService } from '../../../services/snackbar.service';

@Component({
  selector: 'app-team-actions',
  imports: [MatButtonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './team-actions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Reuse the global .player-actions flex style so buttons sit inline
  host: { class: 'player-actions' },
})
export class TeamActionsComponent {
  private readonly dialog = inject(DialogService);
  private readonly snackbarService = inject(SnackbarService);

  /** The team to act upon. */
  readonly team = input.required<Team>();
  /** Writable signal of all teams — used for edit validation and deletion. */
  readonly teams = input.required<WritableSignal<Team[]>>();
  /** Writable signal of all players — used to remove players when a team is deleted. */
  readonly players = input.required<WritableSignal<Player[]>>();

  readonly editAriaLabel = input<string>('Edit team');
  readonly deleteAriaLabel = input<string>('Delete team');

  handleEdit(): void {
    const team = this.team();

    const dialogRef = this.dialog.open<InputDialogComponent, InputDialogData, string | null>(
      InputDialogComponent,
      {
        data: {
          title: 'Edit Team',
          label: 'Team name',
          value: team.name,
          confirmText: 'Save',
          cancelText: 'Cancel',
          required: true,
        } satisfies InputDialogData,
      },
    );

    dialogRef.afterClosed().subscribe((newName) => {
      if (!newName?.trim()) return;
      const trimmed = newName.trim();
      if (this.teams()().some(t => t.id !== team.id && t.name.toLowerCase() === trimmed.toLowerCase())) {
        this.snackbarService.showError(`Team "${trimmed}" already exists`);
        return;
      }
      this.teams().update(ts => ts.map(t => t.id === team.id ? { ...t, name: trimmed } : t));
    });
  }

  handleDelete(): void {
    const team = this.team();

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Team',
        message: `Are you sure you want to delete team "${team.name}" and all its players?`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      const { id, playerIds } = team;
      this.teams().update(ts => ts.filter(t => t.id !== id));
      this.players().update(ps => ps.filter(p => !playerIds.includes(p.id)));
    });
  }
}

