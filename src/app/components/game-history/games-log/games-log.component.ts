import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GameStore } from '../../../services/game.store';
import { showSnackbarError, showSnackbarSuccess } from '../../../utils/snackbar';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'games-log',
  imports: [
    CommonModule,
    MatExpansionModule,
    MatListModule,
    MatCard,
    MatCardHeader,
    MatCardContent,
    MatCardTitle,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './games-log.component.html',
  styleUrl: './games-log.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GamesLogComponent {
  store = inject(GameStore);
  private readonly snackBar: MatSnackBar = inject(MatSnackBar);
  gameHistory = this.store.gameHistory;

  async saveGameLog(): Promise<void> {
    const dataToSave = {
      gameHistory: this.store.gameHistory(),
      players: this.store.players(),
      teams: this.store.teams(),
    };

    const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: 'application/json' });

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const fileName = `dice-game-${year}-${month}-${day}_${hours}-${minutes}.json`;

    // Try to use File System Access API for "Save As" dialog
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          startIn: 'downloads',
          types: [{
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] },
          }],
        });

        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        showSnackbarSuccess(this.snackBar, `File '${fileName}' has been saved`)
        return;
      } catch (err: any) {
        // If user cancels, we just return
        if (err.name === 'AbortError') {
          return;
        }
        console.error('Save as dialog failed', err);
        showSnackbarError(this.snackBar, `Error: file '${fileName}' has NOT been saved`)
        // Fallback to direct download if something else went wrong
      }
    }

    // Fallback: Direct download
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
    showSnackbarSuccess(this.snackBar, `File '${fileName}' has been saved to 'Downloads'`)
  }
}
