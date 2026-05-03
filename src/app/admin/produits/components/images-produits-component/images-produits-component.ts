import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProduitStoreService } from '../../core/produit-store.service';
import { ProduitResponse } from '../../models/produit.model';
import { ProduitService } from '../../service/produit-service/produit-service';

@Component({
  selector: 'app-images-produits-component',
  templateUrl: './images-produits-component.html',
  styleUrl: './images-produits-component.css',
  standalone: false,
})
export class ImagesProduitsComponent implements OnInit {
  produits: ProduitResponse[] = [];
  filteredProduits: ProduitResponse[] = [];
  loading = false;
  searchTerm = '';

  constructor(
    private produitStore: ProduitStoreService,
    private router: Router,
    private produitService: ProduitService, // 🔥 AJOUTER

  ) {}

  ngOnInit(): void {
    this.produitStore.produits$.subscribe(data => {
      this.produits = data;
      this.applyFilter();
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

  getImagePrincipale(produit: ProduitResponse): string | null {
    if (!produit.images || produit.images.length === 0) return null;
    const principale = produit.images.find(img => img.principale);
    return principale?.url || produit.images[0]?.url || null;
  }

  openProduit(produit: ProduitResponse): void {
    this.router.navigate(['/admin/produits/images', produit.id]);
  }

getBarcodeUrl(id: number): string {
  return this.produitService.getBarcodeImageUrl(id);
}

onBarcodeError(id: number): void {
  console.error('Erreur barcode', id, this.getBarcodeUrl(id));
}

}
