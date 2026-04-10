import { Component, OnInit } from '@angular/core';
import { ProduitStoreService } from '../../core/produit-store.service';
import { ProduitResponse, FlatProductLabel } from '../../models/produit.model';
import { ProduitService } from '../../service/produit-service/produit-service';

@Component({
  selector: 'app-scan-barcode-component',
  templateUrl: './scan-barcode-component.html',
  styleUrl: './scan-barcode-component.css',
  standalone: false
})
export class ScanBarcodeComponent implements OnInit {
  produits: ProduitResponse[] = [];
  filteredProduits: ProduitResponse[] = [];
  loading = false;
  searchTerm = '';

  selectedMap: Record<number, boolean> = {};
  quantityMap: Record<number, number> = {};

  labelsToPrint: FlatProductLabel[] = [];
  previewMode = false;

  constructor(
    private produitStore: ProduitStoreService,
    private produitService: ProduitService
  ) {}

  ngOnInit(): void {
    this.produitStore.produits$.subscribe(data => {
      this.produits = data;
      this.filteredProduits = [...data];

      for (const p of data) {
        if (this.quantityMap[p.id] == null) {
          this.quantityMap[p.id] = 1;
        }
      }
    });

    this.produitStore.loading$.subscribe(loading => {
      this.loading = loading;
    });

    this.produitStore.loadIfNeeded().subscribe();
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      this.filteredProduits = [...this.produits];
      return;
    }

    this.filteredProduits = this.produits.filter(p =>
      (p.nom || '').toLowerCase().includes(term) ||
      (p.codeBarres || '').toLowerCase().includes(term) ||
      (p.categorieNom || '').toLowerCase().includes(term)
    );
  }

  getBarcodeUrl(id: number): string {
    return this.produitService.getBarcodeImageUrl(id);
  }

  getImagePrincipale(produit: ProduitResponse): string | null {
    if (!produit.images || produit.images.length === 0) return null;
    const principale = produit.images.find(img => img.principale);
    return principale?.url || produit.images[0]?.url || null;
  }

  toggleAll(checked: boolean): void {
    for (const p of this.filteredProduits) {
      this.selectedMap[p.id] = checked;
    }
  }

  buildLabels(): void {
    const output: FlatProductLabel[] = [];

    for (const produit of this.produits) {
      if (!this.selectedMap[produit.id]) continue;

      const qty = Number(this.quantityMap[produit.id] || 0);
      if (qty <= 0) continue;

      for (let i = 0; i < qty; i++) {
        output.push({
          produitId: produit.id,
          nom: produit.nom,
          prixVente: produit.prixVente,
          codeBarres: produit.codeBarres
        });
      }
    }

    this.labelsToPrint = output;
    this.previewMode = output.length > 0;
  }

  print(): void {
    window.print();
  }

  backToSelection(): void {
    this.previewMode = false;
  }

  get selectedCount(): number {
    return Object.values(this.selectedMap).filter(Boolean).length;
  }

  get totalLabels(): number {
    return this.labelsToPrint.length;
  }
}
