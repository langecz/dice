import { MatSnackBar } from '@angular/material/snack-bar';

const SNACKBAR_DURATION = 3000;

export function showSnackbarError(snackBar: MatSnackBar, message: string): void {
  if (!snackBar || !message) return;
  snackBar.open(message, 'Close', {
    duration: SNACKBAR_DURATION,
    verticalPosition: 'top',
    panelClass: ['error-snackbar']
  });
}

export function showSnackbarSuccess(snackBar: MatSnackBar, message: string): void {
  if (!snackBar || !message) return;
  snackBar.open(message, 'Close', {
    duration: SNACKBAR_DURATION,
    verticalPosition: 'top',
    panelClass: ['success-snackbar']
  });
}
