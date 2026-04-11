import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
export interface ConfirmAnnulationVenteDialogData {
  ticketNumero?: string;
  clientNom?: string;
  totalTTC?: number;
  devise?: string;
}
@Component({
  selector: 'app-confirm-annulation-vente-dialog-component',
  templateUrl: './confirm-annulation-vente-dialog-component.html',
  styleUrl: './confirm-annulation-vente-dialog-component.css',
  standalone: false
})
export class ConfirmAnnulationVenteDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<ConfirmAnnulationVenteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmAnnulationVenteDialogData
  ) {}

  close(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }

}
