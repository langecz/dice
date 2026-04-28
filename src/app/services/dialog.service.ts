import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { ComponentType } from '@angular/cdk/portal';
import { TemplateRef } from '@angular/core';
import { LayoutService } from './layout.service';

/**
 * Wraps MatDialog with responsive sizing:
 * - Mobile: full-screen (100vw, anchored to top-left)
 * - Tablet / Laptop: centered dialog with a sensible max width
 */
@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly dialog = inject(MatDialog);
  private readonly layout = inject(LayoutService);

  open<T, D = unknown, R = unknown>(
    componentOrTemplate: ComponentType<T> | TemplateRef<T>,
    config?: MatDialogConfig<D>,
  ): MatDialogRef<T, R> {
    const isMobile = this.layout.isMobile();

    const mobileOptions: MatDialogConfig = isMobile
      ? {
          width: '100vw',
          maxWidth: '100vw',
          position: { top: '0', left: '0' },
          panelClass: 'mobile-fullscreen-dialog',
        }
      : {
          width: '420px',
          maxWidth: '90vw',
        };

    return this.dialog.open<T, D, R>(componentOrTemplate as ComponentType<T>, {
      ...mobileOptions,
      ...config,
    });
  }

  closeAll(): void {
    this.dialog.closeAll();
  }
}

