import { Component, computed, Inject, OnInit, signal } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BarcodeFormat } from '@zxing/library';

export interface ProduitTarifieDialog {
  id: number;
  codeBarres: string;
  reference?: string;
  nom: string;
  description?: string;
  categorieId: number;
  categorieNom?: string;

  tarifId: number | null;
  tarifNom: string | null;
  tarifCode?: string | null;

  prixBrut: number;
  prixFinal: number;
  prixUnitaire?: number;

  montantRemise?: number;
  tauxRemiseApplique?: number;
  tauxRemiseMax?: number;

  stock?: number;
  stockMinimum?: number;
  stockMaximum?: number;
  actif?: boolean;

  imagePrincipale?: string | null;
  images?: any[];

  produitSource?: any;
  regleSource?: any | null;
}

export interface ProduitPickerDialogData {
  produits: ProduitTarifieDialog[];
  tarifId: number | null;
  tarifNom: string;
}

export interface ProduitSelectionPanier {
  produit: ProduitTarifieDialog;
  quantite: number;
}
@Component({
  selector: 'app-produit-picker-dialog-component',
  templateUrl: './produit-picker-dialog-component.html',
  styleUrl: './produit-picker-dialog-component.css',
  standalone: false
})
export class ProduitPickerDialogComponent implements  OnInit {
produits = signal<ProduitTarifieDialog[]>([]);
  filteredProduits = signal<ProduitTarifieDialog[]>([]);

  selectedItems = signal<Map<number, ProduitSelectionPanier>>(new Map());

  search = signal<string>('');
  scannerOpen = signal<boolean>(false);
  loadingScan = signal<boolean>(false);

  readonly allowedFormats = [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E
  ];

  readonly totalSelectionnes = computed(() => this.selectedItems().size);

  readonly totalQuantite = computed(() => {
    let total = 0;
    this.selectedItems().forEach(item => total += item.quantite);
    return total;
  });

  readonly totalMontant = computed(() => {
    let total = 0;
    this.selectedItems().forEach(item => {
      total += (this.toNumber(item.produit.prixFinal) * this.toNumber(item.quantite));
    });
    return this.arrondir2(total);
  });

  constructor(
    private dialogRef: MatDialogRef<ProduitPickerDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProduitPickerDialogData
  ) {
    this.dialogRef.disableClose = true;
  }

  ngOnInit(): void {
    const list = Array.isArray(this.data?.produits) ? this.data.produits : [];
    this.produits.set(list);
    this.filteredProduits.set(list);
  }

  close(): void {
    this.dialogRef.close(null);
  }

  validerSelection(): void {
    const values = Array.from(this.selectedItems().values());

    if (!values.length) {
      this.dialogRef.close(null);
      return;
    }

    this.dialogRef.close(values);
  }

  appliquerRecherche(): void {
    const term = this.search().trim().toLowerCase();

    if (!term) {
      this.filteredProduits.set(this.produits());
      return;
    }

    const filtered = this.produits().filter(p =>
      (p.nom || '').toLowerCase().includes(term) ||
      (p.codeBarres || '').toLowerCase().includes(term) ||
      (p.reference || '').toLowerCase().includes(term) ||
      (p.categorieNom || '').toLowerCase().includes(term) ||
      (p.tarifNom || '').toLowerCase().includes(term)
    );

    this.filteredProduits.set(filtered);
  }

  onSearchChange(value: string): void {
    this.search.set(value ?? '');
    this.appliquerRecherche();
  }

  clearSearch(): void {
    this.search.set('');
    this.filteredProduits.set(this.produits());
  }

  openScanner(): void {
    this.scannerOpen.set(true);
  }

  closeScanner(): void {
    this.scannerOpen.set(false);
  }

  onCodeResult(result: string): void {
    if (!result) return;

    const code = result.trim().toLowerCase();

    const produit = this.produits().find(p =>
      (p.codeBarres || '').trim().toLowerCase() === code
    );

    if (!produit) {
      return;
    }

    this.addOrIncrement(produit, 1);
    this.search.set(produit.codeBarres || '');
    this.appliquerRecherche();
  }

  isSelected(produitId: number): boolean {
    return this.selectedItems().has(Number(produitId));
  }

  getQuantite(produitId: number): number {
    return this.selectedItems().get(Number(produitId))?.quantite ?? 1;
  }

  toggleProduit(produit: ProduitTarifieDialog): void {
    const map = new Map(this.selectedItems());

    if (map.has(Number(produit.id))) {
      map.delete(Number(produit.id));
    } else {
      map.set(Number(produit.id), {
        produit,
        quantite: 1
      });
    }

    this.selectedItems.set(map);
  }

  addOrIncrement(produit: ProduitTarifieDialog, step: number = 1): void {
    const map = new Map(this.selectedItems());
    const existing = map.get(Number(produit.id));

    if (existing) {
      existing.quantite = this.normalizeQuantite(existing.quantite + step);
      map.set(Number(produit.id), { ...existing });
    } else {
      map.set(Number(produit.id), {
        produit,
        quantite: this.normalizeQuantite(step)
      });
    }

    this.selectedItems.set(map);
  }

  decrement(produit: ProduitTarifieDialog): void {
    const map = new Map(this.selectedItems());
    const existing = map.get(Number(produit.id));

    if (!existing) return;

    const nextQty = existing.quantite - 1;

    if (nextQty <= 0) {
      map.delete(Number(produit.id));
    } else {
      map.set(Number(produit.id), {
        ...existing,
        quantite: nextQty
      });
    }

    this.selectedItems.set(map);
  }

  increment(produit: ProduitTarifieDialog): void {
    this.addOrIncrement(produit, 1);
  }

  setQuantite(produit: ProduitTarifieDialog, value: any): void {
    const qty = this.normalizeQuantite(value);
    const map = new Map(this.selectedItems());

    map.set(Number(produit.id), {
      produit,
      quantite: qty
    });

    this.selectedItems.set(map);
  }

  retirerProduit(produitId: number): void {
    const map = new Map(this.selectedItems());
    map.delete(Number(produitId));
    this.selectedItems.set(map);
  }

  ajouterProduit(produit: ProduitTarifieDialog): void {
    this.addOrIncrement(produit, 1);
  }

  viderSelection(): void {
    this.selectedItems.set(new Map());
  }

  getImage(produit: ProduitTarifieDialog): string {
    return produit?.imagePrincipale || 'assets/no-image.png';
  }

  getPrix(produit: ProduitTarifieDialog): number {
    return this.toNumber(produit?.prixFinal ?? produit?.prixUnitaire ?? 0);
  }

  getStock(produit: ProduitTarifieDialog): number {
    return this.toNumber(produit?.stock ?? 0);
  }

  getStockClass(produit: ProduitTarifieDialog): string {
    const stock = this.getStock(produit);
    const min = this.toNumber(produit?.stockMinimum ?? 0);

    if (stock <= 0) return 'danger';
    if (min > 0 && stock <= min) return 'warning';
    return 'success';
  }

  getSousTotalSelection(produitId: number): number {
    const item = this.selectedItems().get(Number(produitId));
    if (!item) return 0;
    return this.arrondir2(this.getPrix(item.produit) * this.toNumber(item.quantite));
  }

  trackByProduit(_: number, item: ProduitTarifieDialog): number {
    return Number(item.id);
  }

  private normalizeQuantite(value: any): number {
    const n = Math.floor(this.toNumber(value));
    return n > 0 ? n : 1;
  }




  formatFC(value: number | null | undefined): string {
  return `${this.arrondir2(this.toNumber(value)).toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })} FC`;
}

formatUSD(value: number | null | undefined): string {
  return `${this.arrondir2(this.toNumber(value)).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} USD`;
}

getPrixFC(p: any): number {
  return this.toNumber(
    p?.prixUnitaireCDF ??
    p?.prixFinalCDF ??
    p?.prixFinal ??
    p?.prixUnitaire ??
    0
  );
}

getPrixUSD(p: any): number {
  return this.toNumber(
    p?.prixUnitaireUSD ??
    p?.prixFinalUSD ??
    0
  );
}

getRemiseFC(p: any): number {
  return this.toNumber(
    p?.montantRemiseCDF ??
    p?.montantRemise ??
    0
  );
}

getRemiseUSD(p: any): number {
  return this.toNumber(
    p?.montantRemiseUSD ??
    0
  );
}

getSousTotalSelectionFC(produitId: number): number {
  const item = this.selectedItems().get(produitId);
  if (!item) return 0;

  return this.arrondir2(this.getPrixFC(item.produit) * this.toNumber(item.quantite));
}

getSousTotalSelectionUSD(produitId: number): number {
  const item = this.selectedItems().get(produitId);
  if (!item) return 0;

  return this.arrondir2(this.getPrixUSD(item.produit) * this.toNumber(item.quantite));
}

totalMontantFC(): number {
  let total = 0;

  this.selectedItems().forEach(item => {
    total += this.getPrixFC(item.produit) * this.toNumber(item.quantite);
  });

  return this.arrondir2(total);
}

totalMontantUSD(): number {
  let total = 0;

  this.selectedItems().forEach(item => {
    total += this.getPrixUSD(item.produit) * this.toNumber(item.quantite);
  });

  return this.arrondir2(total);
}

formatTauxProduit(p: any): string {
  const taux = this.toNumber(p?.tauxChangeUtilise);
  return taux > 0 ? `1 USD = ${this.formatFC(taux)}` : 'Taux non défini';
}

private toNumber(value: any): number {
  if (value === null || value === undefined || value === '') return 0;
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}

private arrondir2(value: number): number {
  return Number(this.toNumber(value).toFixed(2));
}
}
