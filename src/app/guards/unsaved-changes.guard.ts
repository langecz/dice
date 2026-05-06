import { CanDeactivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { map } from 'rxjs';
import { DialogService } from '../services/dialog.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../components/shared/confirm-dialog/confirm-dialog.component';
import { HasUnsavedChanges } from '../interfaces/unsaved-changes.interface';

/**
 * Guard that prevents navigating away from a component if it has unsaved changes.
 * The component must implement the HasUnsavedChanges interface.
 */
export const hasUnsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (component) => {
  const dialogService = inject(DialogService);

  // If the component doesn't report unsaved changes, allow navigation
  if (!component.hasUnsavedChanges()) {
    return true;
  }

  // Otherwise, show the confirmation dialog
  const dialogRef = dialogService.open<
    ConfirmDialogComponent,
    ConfirmDialogData,
    boolean
  >(ConfirmDialogComponent, {
    data: {
      title: 'Unsaved Changes',
      message: 'You have unsaved changes. Are you sure you want to leave without saving?',
      confirmText: 'Leave',
      cancelText: 'Stay',
    },
  });

  return dialogRef.afterClosed().pipe(map((confirmed) => !!confirmed));
};
