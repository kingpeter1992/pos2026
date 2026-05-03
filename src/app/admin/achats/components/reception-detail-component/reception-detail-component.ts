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
    this.lignes().reduce((sum: number, l: any) => sum + this.getMontantAchatFc(l), 0)
  );

  readonly totalAchatUsd = computed(() =>
    this.lignes().reduce((sum: number, l: any) => sum + this.getMontantAchatUsd(l), 0)
  );

  readonly totalFrais = computed(() =>
    this.lignes().reduce((sum: number, l: any) => sum + this.getPartFraisFc(l), 0)
  );

  readonly totalFraisUsd = computed(() =>
    this.lignes().reduce((sum: number, l: any) => sum + this.getPartFraisUsd(l), 0)
  );

  readonly totalFinalFc = computed(() =>
    this.lignes().reduce((sum: number, l: any) => sum + this.getMontantFinalFc(l), 0)
  );

  readonly totalFinalUsd = computed(() =>
    this.lignes().reduce((sum: number, l: any) => sum + this.getMontantFinalUsd(l), 0)
  );

  getTauxReception(): number {
    return Number(this.data?.tauxChangeUtilise ?? this.data?.taux ?? 0);
  }

  convertFcToUsd(montantFc: number): number {
    const taux = this.getTauxReception();
    if (!montantFc || taux <= 0) return 0;
    return +(montantFc / taux).toFixed(2);
  }

  getPrixAchatFc(row: any): number {
    return Number(row?.prixAchatUnitaireFc ?? row?.prixAchatUnitaire ?? 0);
  }

  getPrixAchatUsd(row: any): number {
    const usd = row?.prixAchatUnitaireUsd;
    if (usd != null) return Number(usd);
    return this.convertFcToUsd(this.getPrixAchatFc(row));
  }

  getMontantAchatFc(row: any): number {
    return Number(row?.montantLigneFc ?? row?.montantAchat ?? 0);
  }

  getMontantAchatUsd(row: any): number {
    const usd = row?.montantLigneUsd;
    if (usd != null) return Number(usd);
    return this.convertFcToUsd(this.getMontantAchatFc(row));
  }

  getPartFraisFc(row: any): number {
    return Number(row?.partFrais ?? 0);
  }

  getPartFraisUsd(row: any): number {
    const usd = row?.partFraisUsd;
    if (usd != null) return Number(usd);
    return this.convertFcToUsd(this.getPartFraisFc(row));
  }

  getFraisUnitaireFc(row: any): number {
    return Number(row?.fraisUnitaire ?? row?.fraisUnitaireFc ?? 0);
  }

  getFraisUnitaireUsd(row: any): number {
    const usd = row?.fraisUnitaireUsd;
    if (usd != null) return Number(usd);
    return this.convertFcToUsd(this.getFraisUnitaireFc(row));
  }

  getCoutFinalFc(row: any): number {
    return Number(row?.coutUnitaireFinal ?? row?.coutUnitaireFinalFc ?? 0);
  }

  getCoutFinalUsd(row: any): number {
    const usd = row?.coutUnitaireFinalUsd;
    if (usd != null) return Number(usd);
    return this.convertFcToUsd(this.getCoutFinalFc(row));
  }

  getMontantFinalFc(row: any): number {
    return Number(
      row?.montantFinalLigneFc ??
      row?.montantFinalLigne ??
      this.getCoutFinalFc(row) * Number(row?.quantiteRecue || 0)
    );
  }

  getMontantFinalUsd(row: any): number {
    const usd = row?.montantFinalLigneUsd;
    if (usd != null) return Number(usd);
    return this.convertFcToUsd(this.getMontantFinalFc(row));
  }

  formatFc(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  }

  formatUsd(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value || 0));
  }

  close(): void {
    this.dialogRef.close();
  }

  trackByLine(index: number, item: any): number {
    return Number(item?.id ?? index);
  }

  goToLocators(): void {
    if (!this.data?.id) return;

    this.dialogRef.close();
    this.router.navigate(['admin/achats/receptions/locators', this.data.id]);
  }
}
