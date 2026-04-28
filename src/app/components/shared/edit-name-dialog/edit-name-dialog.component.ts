import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

export interface EditNameDialogData {
  title: string;
  label: string;
  currentName: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-edit-name-dialog',
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule],
  templateUrl: './edit-name-dialog.component.html',
  styleUrl: './edit-name-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditNameDialogComponent {
  readonly data = inject<EditNameDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<EditNameDialogComponent>);

  name = signal(this.data.currentName);

  confirm(): void {
    this.dialogRef.close(this.name());
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}


