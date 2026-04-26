import { Component, computed, Inject, inject, signal } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
@Component({
  selector: 'app-reception-detail-component',
  templateUrl: './reception-detail-component.html',
  styleUrl: './reception-detail-component.css',
  standalone: false
})
export class ReceptionDetailComponent {

  displayedColumns: string[] = [
    'produit',
    'categorie',
    'quantiteRecue',
    'prixAchatUnitaire',
    'montantAchat',
    'partFrais',
    'fraisUnitaire',
    'coutUnitaireFinal'
  ];

  readonly lignes: any;

  constructor(
    public dialogRef: MatDialogRef<ReceptionDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private router: Router
  ) {
    this.lignes = signal(this.data?.lignes ?? []);
  }

  readonly totalQuantite = computed(() =>
    this.lignes().reduce((sum: number, l: any) => sum + Number(l?.quantiteRecue || 0), 0)
  );

  readonly totalAchat = computed(() =>
    this.lignes().reduce((sum: number, l: any) => sum + Number(l?.montantAchat || 0), 0)
  );

  readonly totalFrais = computed(() =>
    this.lignes().reduce((sum: number, l: any) => sum + Number(l?.partFrais || 0), 0)
  );


  close(): void {
    this.dialogRef.close();
  }

  trackByLine(index: number, item: any): number {
    return Number(item?.id ?? index);
  }

goToLocators(): void {
  if (!this.data?.id) {
    return;
  }

  this.dialogRef.close();
  this.router.navigate(['admin/achats/receptions/locators', this.data.id]);
}
}
