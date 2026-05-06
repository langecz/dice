import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

import { GameLogExportService } from '../../../services/game-log-export';

export interface ResetGameConfirmDialogData {
  hasGameHistory: boolean;
}

export type ResetGameConfirmDialogResult = 'reset' | 'save' | 'cancel';

@Component({
  selector: 'reset-game-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule, MatCardModule],
  templateUrl: './reset-game-confirm-dialog.component.html',
  styleUrl: './reset-game-confirm-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetGameConfirmDialogComponent {
  readonly data = inject<ResetGameConfirmDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ResetGameConfirmDialogComponent, ResetGameConfirmDialogResult>);
  private readonly gameLogExportService = inject(GameLogExportService);

  cancel(): void {
    this.dialogRef.close('cancel');
  }

  reset(): void {
    this.dialogRef.close('reset');
  }

  async save(): Promise<void> {
    await this.gameLogExportService.saveGameLog();
  }
}
