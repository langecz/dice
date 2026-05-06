import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

const SNACKBAR_DURATION = 3000;

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {
  private readonly snackBar = inject(MatSnackBar);

  showError(message: string): void {
    if (!message) return;
    this.snackBar.open(message, 'Close', {
      duration: SNACKBAR_DURATION,
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  showSuccess(message: string): void {
    if (!message) return;
    this.snackBar.open(message, 'Close', {
      duration: SNACKBAR_DURATION,
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }
}
