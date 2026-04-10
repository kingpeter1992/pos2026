import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { take, finalize } from 'rxjs';
import { ProduitResponse } from '../../../produits/models/produit.model';
import { ProduitStoreService } from '../../../produits/core/produit-store.service';

@Component({
  selector: 'app-produit-selection-dialog-component',
  templateUrl: './produit-selection-dialog-component.html',
  styleUrl: './produit-selection-dialog-component.css',
  standalone : false
})
export class ProduitSelectionDialogComponent  implements OnInit {

  produits: ProduitResponse[] = [];
  filteredProduits: ProduitResponse[] = [];

  loading = false;
  search = '';

  displayedColumns: string[] = [
    'image',
    'codeBarres',
    'nom',
    'categorie',
    'prixAchat',
    'prixVente',
    'action'
  ];

  constructor(
    private dialogRef: MatDialogRef<ProduitSelectionDialogComponent>,
    private produitStore: ProduitStoreService
  ) {}

  ngOnInit(): void {
    this.loadProduits();
  }

  loadProduits(): void {
    this.loading = true;

    this.produitStore.loadIfNeeded()
      .pipe(
        take(1),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (produits: ProduitResponse[]) => {
          this.produits = produits ?? [];
          this.filteredProduits = [...this.produits];
        },
        error: (err) => {
          console.error('Erreur chargement produits', err);
        }
      });
  }

  onSearchChange(): void {
    const keyword = this.normalize(this.search);

    if (!keyword) {
      this.filteredProduits = [...this.produits];
      return;
    }

    this.filteredProduits = this.produits.filter(p =>
      this.normalize(p.nom).includes(keyword) ||
      this.normalize(p.codeBarres).includes(keyword) ||
      this.normalize(p.id).includes(keyword) ||
      this.normalize(this.getCategorieNom(p)).includes(keyword)
    );
  }

  choisirProduit(produit: ProduitResponse): void {
    this.dialogRef.close(produit);
  }

  cancel(): void {
    this.dialogRef.close();
  }

  getCategorieNom(produit: ProduitResponse): string {
    return produit.categorieNom|| '';
  }

  getImageUrl(produit: ProduitResponse): string {
    const imagePrincipale = produit.images?.find(img => img.principale);
    const premiereImage = produit.images?.[0];
    return imagePrincipale?.url || premiereImage?.url || 'assets/img/no-image.png';
  }

  trackByProduit(index: number, item: ProduitResponse): number {
    return item.id;
  }

  private normalize(value: any): string {
    return (value || '')
      .toString()
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
