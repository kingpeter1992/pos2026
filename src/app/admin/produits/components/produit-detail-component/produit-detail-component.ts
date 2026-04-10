import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProduitStoreService } from '../../core/produit-store.service';
import { ProduitResponse } from '../../models/produit.model';
import { ProduitService } from '../../service/produit-service/produit-service';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private produitStore: ProduitStoreService,
    private produitService: ProduitService
  ) {}

  ngOnInit(): void {
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
