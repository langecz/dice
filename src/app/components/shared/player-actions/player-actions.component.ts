import { ChangeDetectionStrategy, Component, inject, input, WritableSignal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Player, Team } from '../../../models/game.models';
import { DialogService } from '../../../services/dialog.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { EditNameDialogComponent, EditNameDialogData } from '../edit-name-dialog/edit-name-dialog.component';
import { showSnackbarError } from '../../../utils/snackbar';

@Component({
  selector: 'app-player-actions',
  imports: [MatButtonModule, MatIconModule, MatSnackBarModule],
  templateUrl: './player-actions.component.html',
  styleUrl: './player-actions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'player-actions-row' },
})
export class PlayerActionsComponent {
  private readonly dialog = inject(DialogService);
  private readonly snackBar = inject(MatSnackBar);

  /** The player to display and act upon. */
  readonly player = input.required<Player>();
  /** Writable signal holding the full player list — used for edit validation and deletion. */
  readonly players = input.required<WritableSignal<Player[]>>();
  /**
   * Optional writable signal for the teams list.
   * When provided, deleting a player also removes them from all team rosters.
   */
  readonly teams = input<WritableSignal<Team[]> | null>(null);

  readonly editAriaLabel = input<string>('Edit player');
  readonly deleteAriaLabel = input<string>('Delete player');

  handleEdit(): void {
    const player = this.player();

    const dialogRef = this.dialog.open<EditNameDialogComponent, EditNameDialogData, string | null>(
      EditNameDialogComponent,
      {
        data: {
          title: 'Edit Player',
          label: 'Player name',
          currentName: player.name,
          confirmText: 'Save',
          cancelText: 'Cancel',
        } satisfies EditNameDialogData,
      },
    );

    dialogRef.afterClosed().subscribe((newName: string | null | undefined) => {
      if (!newName?.trim()) return;
      const trimmed = newName.trim();
      if (this.players()().some(p => p.id !== player.id && p.name.toLowerCase() === trimmed.toLowerCase())) {
        showSnackbarError(this.snackBar, `Player "${trimmed}" already exists`);
        return;
      }
      this.players().update(ps => ps.map(p => p.id === player.id ? { ...p, name: trimmed } : p));
    });
  }

  handleDelete(): void {
    const player = this.player();

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Player',
        message: `Are you sure you want to delete player "${player.name}"?`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      const { id } = player;
      this.players().update(ps => ps.filter(p => p.id !== id));
      this.teams()?.update(ts => ts.map(t => ({ ...t, playerIds: t.playerIds.filter(pid => pid !== id) })));
    });
  }
}
