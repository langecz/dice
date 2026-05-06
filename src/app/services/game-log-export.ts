import { inject, Injectable } from '@angular/core';
import { GameStore } from './game.store';
import { SnackbarService } from './snackbar.service';

@Injectable({ providedIn: 'root' })
export class GameLogExportService {
  private readonly store = inject(GameStore);
  private readonly snackbarService = inject(SnackbarService);

  async saveGameLog(): Promise<boolean> {
    const dataToSave = {
      gameHistory: this.store.gameHistory(),
      players: this.store.players(),
      teams: this.store.teams(),
    };

    const blob = new Blob([JSON.stringify(dataToSave, null, 2)], {
      type: 'application/json',
    });

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const fileName = `dice-game-${year}-${month}-${day}_${hours}-${minutes}.json`;

    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          startIn: 'downloads',
          types: [
            {
              description: 'JSON Files',
              accept: { 'application/json': ['.json'] },
            },
          ],
        });

        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();

        this.snackbarService.showSuccess(`File '${fileName}' has been saved`);
        return true;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return false;
        }

        console.error('Save as dialog failed', err);
        this.snackbarService.showError(`Error: file '${fileName}' has NOT been saved`);
      }
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = fileName;
    link.click();

    window.URL.revokeObjectURL(url);

    this.snackbarService.showSuccess(`File '${fileName}' has been saved to 'Downloads'`);
    return true;
  }
}
