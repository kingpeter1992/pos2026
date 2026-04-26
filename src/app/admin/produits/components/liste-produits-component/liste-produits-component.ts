import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ProduitStoreService } from '../../core/produit-store.service';
import { ProduitRequest, ProduitResponse } from '../../models/produit.model';
import { ProduitService } from '../../service/produit-service/produit-service';
import { ProduitDialog } from '../produit-dialog/produit-dialog';
import { Toast } from '../../../../shares/services/toast/toast';

@Component({
  selector: 'app-liste-produits-component',
  templateUrl: './liste-produits-component.html',
  styleUrl: './liste-produits-component.css',
  standalone: false,
})
export class ListeProduitsComponent implements OnInit {
  produits: ProduitResponse[] = [];
  filteredProduits: ProduitResponse[] = [];
  loading = false;
  searchTerm = '';

  kpiTotal = 0;
  kpiActifs = 0;
  kpiAvecImages = 0;
  kpiSansCategorie = 0;

  constructor(
    private produitStore: ProduitStoreService,
    private produitService: ProduitService,
    private dialog: MatDialog,
    private toast:Toast
  ) {}

  ngOnInit(): void {
    this.produitStore.produits$.subscribe(data => {
      this.produits = [...data];
      console.log('list catalogue produit', this.produits)
      this.applyFilter();
      this.computeKpis();
    });

    this.produitStore.loading$.subscribe(loading => {
      this.loading = loading;
    });

    this.produitStore.loadIfNeeded().subscribe();
  }
openEditDialog(produit: ProduitResponse): void {
  const dialogRef = this.dialog.open(ProduitDialog, {
    width: '1000px',
    maxWidth: '96vw',
    disableClose: true,
    data: {
      mode: 'edit',
      produit
    }
  });

  dialogRef.afterClosed().subscribe((result: ProduitRequest | undefined) => {
    if (!result) return;

    this.loading = true;

    this.produitService.update(produit.id, result as any).subscribe({
      next: (res) => {
        this.produitStore.updateOne(res);
        this.toast.success('modification réussi')
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Erreur modification produit', err);
      }
    });
  });
}
  computeKpis(): void {
    this.kpiTotal = this.produits.length;
    this.kpiActifs = this.produits.filter(p => p.actif).length;
    this.kpiAvecImages = this.produits.filter(p => p.images && p.images.length > 0).length;
    this.kpiSansCategorie = this.produits.filter(p => !p.categorieNom).length;
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
      (p.categorieNom || '').toLowerCase().includes(term) ||
      (p.description || '').toLowerCase().includes(term)
    );
  }

  refresh(): void {
    this.loading = true;
    this.produitStore.refresh().subscribe({
      next: () => this.loading = false,
      error: () => this.loading = false
    });
  }

  getImagePrincipale(produit: ProduitResponse): string | null {
    if (!produit.images || produit.images.length === 0) return null;

    const principale = produit.images.find(img => img.principale);
    return principale?.url || produit.images[0]?.url || null;
  }

  getBarcodeUrl(id: number): string {
    return this.produitService.getBarcodeImageUrl(id);
  }



  getSeverity(actif: boolean): 'success' | 'danger' {
    return actif ? 'success' : 'danger';

  }
}
