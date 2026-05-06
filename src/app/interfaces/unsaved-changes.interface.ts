import { Signal } from '@angular/core';

export interface HasUnsavedChanges {
  hasUnsavedChanges: Signal<boolean>;
}
