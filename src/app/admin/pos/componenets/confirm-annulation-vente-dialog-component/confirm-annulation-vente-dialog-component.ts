import { Component, Inject } from '@angular/core';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
export interface ConfirmAnnulationVenteDialogData {
  ticketNumero?: string;
  clientNom?: string;
  totalTTC?: number;
  devise?: string;
}

export interface ConfirmAnnulationVenteDialogResult {
  confirmed: boolean;
  commentaire?: string;
}
@Component({
  selector: 'app-confirm-annulation-vente-dialog-component',
  templateUrl: './confirm-annulation-vente-dialog-component.html',
  styleUrl: './confirm-annulation-vente-dialog-component.css',
  standalone: false
})
export class ConfirmAnnulationVenteDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<
      ConfirmAnnulationVenteDialogComponent,
      ConfirmAnnulationVenteDialogResult
    >,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmAnnulationVenteDialogData
  ) {
    this.form = this.fb.group({
      commentaire: ['', [Validators.required, Validators.minLength(5)]]
    });
  }

  close(): void {
    this.dialogRef.close({ confirmed: false });
  }

  confirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.dialogRef.close({
      confirmed: true,
      commentaire: this.form.value.commentaire?.trim() || ''
    });
  }

  get commentaireCtrl() {
    return this.form.get('commentaire');
  }
}
