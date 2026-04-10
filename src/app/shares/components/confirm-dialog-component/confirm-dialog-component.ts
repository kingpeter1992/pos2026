import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-confirm-dialog-component',
  templateUrl: './confirm-dialog-component.html',
  styleUrl: './confirm-dialog-component.css',
  standalone:false
})
export class ConfirmDialogComponent {
constructor(
    private dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      title?: string;
      message: string;
      confirmText?: string;
      cancelText?: string;
    }
  ) {}

  confirm() {
    this.dialogRef.close(true);
  }

  cancel() {
    this.dialogRef.close(false);
  }

}
