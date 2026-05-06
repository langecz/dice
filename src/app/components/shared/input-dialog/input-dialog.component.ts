import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

export interface InputDialogData {
  title: string;
  label: string;
  value: string | number;
  type?: 'text' | 'number';
  description?: string;
  confirmText?: string;
  cancelText?: string;
  required?: boolean;
}

@Component({
  selector: 'app-input-dialog',
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule],
  templateUrl: './input-dialog.component.html',
  styleUrl: './input-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputDialogComponent {
  readonly data = inject<InputDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<InputDialogComponent>);

  value = signal(this.data.value);

  get isValid(): boolean {
    const val = this.value();
    if (this.data.required) {
      if (typeof val === 'string') {
        return val.trim().length > 0;
      }
      return val !== null && val !== undefined;
    }
    return true;
  }

  confirm(): void {
    if (this.isValid) {
      this.dialogRef.close(this.value());
    }
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (this.data.type === 'number') {
      this.value.set(input.valueAsNumber);
    } else {
      this.value.set(input.value);
    }
  }
}
