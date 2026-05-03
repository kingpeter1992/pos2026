import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProduitStoreService } from '../../core/produit-store.service';
import { ProduitResponse } from '../../models/produit.model';
import { ProduitService } from '../../service/produit-service/produit-service';
import { CaisseStoreService } from '../../../caisse/services/CaisseServiceStore';

@Component({
  selector: 'app-produit-detail-component',
  templateUrl: './produit-detail-component.html',
  styleUrl: './produit-detail-component.css',
  standalone: false,
})

export class ProduitDetailComponent implements OnInit {
  produit?: ProduitResponse;
  loading = false;
  imageActive?: string | null;

  dernierTaux = 0;
  loadingTaux = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private produitStore: ProduitStoreService,
    private produitService: ProduitService,
    private caisseStore: CaisseStoreService
  ) {}

  ngOnInit(): void {
    this.chargerDernierTauxActif();
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) return;
    const local = this.produitStore.value.find(p => p.id === id);
    if (local) {
      this.produit = local;
      this.imageActive = this.getImagePrincipale(local);
      return;
    }

    this.loading = true;
    this.produitService.findById(id).subscribe({
      next: (res) => {
        this.produit = res;
        this.imageActive = this.getImagePrincipale(res);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private chargerDernierTauxActif(): void {
    this.loadingTaux = true;

    this.caisseStore.loadTauxActif().subscribe({
      next: (taux) => {
        this.dernierTaux = Number(taux?.taux ?? 0);
        this.loadingTaux = false;
      },
      error: (err) => {
        console.error(err);
        this.dernierTaux = 0;
        this.loadingTaux = false;
      }
    });
  }

  convertirFcEnUsd(montantFc: number): number {
    if (!montantFc || !this.dernierTaux || this.dernierTaux <= 0) {
      return 0;
    }

    return +(Number(montantFc) / this.dernierTaux).toFixed(2);
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

  getImagePrincipale(produit: ProduitResponse): string | null {
    if (!produit.images || produit.images.length === 0) return null;
    const principale = produit.images.find(img => img.principale);
    return principale?.url || produit.images[0]?.url || null;
  }

  selectImage(url: string): void {
    this.imageActive = url;
  }

  back(): void {
    this.router.navigate(['/admin/produits/images']);
  }

  getBarcodeUrl(id: number): string {
    return this.produitService.getBarcodeImageUrl(id);
  }
}
