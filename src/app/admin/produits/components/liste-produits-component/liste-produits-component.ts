import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ProduitStoreService } from '../../core/produit-store.service';
import { ProduitRequest, ProduitResponse } from '../../models/produit.model';
import { ProduitService } from '../../service/produit-service/produit-service';
import { ProduitDialog } from '../produit-dialog/produit-dialog';
import { Toast } from '../../../../shares/services/toast/toast';
import { CaisseStoreService } from '../../../caisse/services/CaisseServiceStore';
import { RequisitionStoreService } from '../../../achats/service/requisition/RequisitionStoreService';
import { ProduitPos } from '../../models/vente.model';

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

produitsPos: ProduitPos[] = [];
selectedStockByProduit = new Map<number, ProduitPos>();

loadingStock = false;

  dernierTaux = 0;
  loadingTaux = false;

  kpiTotal = 0;
  kpiActifs = 0;
  kpiAvecImages = 0;
  kpiSansCategorie = 0;

  constructor(
    private produitStore: ProduitStoreService,
    private produitService: ProduitService,
    private dialog: MatDialog,
    private toast: Toast,
    private caisseStore: CaisseStoreService,
      private requisitionStore: RequisitionStoreService
  ) {}

  ngOnInit(): void {
    this.chargerDernierTauxActif();
    this.chargerProduitsPos();

    this.produitStore.produits$.subscribe(data => {
      this.produits = [...data];
      this.applyFilter();
      this.computeKpis();
    });

    this.produitStore.loading$.subscribe(loading => {
      this.loading = loading;
    });

    this.produitStore.loadIfNeeded().subscribe();
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
        this.loadingTaux = false;
        this.dernierTaux = 0;
        this.toast.warning('Aucun taux de change actif trouvé.');
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
          this.toast.success('Modification réussie');
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

    this.chargerDernierTauxActif();

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

private chargerProduitsPos(): void {
  this.loadingStock = true;

  this.produitService.getProduitsPos().subscribe({
    next: (res) => {
      this.produitsPos = res || [];
      this.loadingStock = false;
    },
    error: (err) => {
      console.error(err);
      this.produitsPos = [];
      this.loadingStock = false;
      this.toast.warning('Impossible de charger les stocks par dépôt.');
    }
  });
}

getStocksProduit(produit: ProduitResponse): ProduitPos[] {
  if (!produit?.id) return [];

  return this.produitsPos.filter(x =>
    Number(x.produitId) === Number(produit.id)
  );
}

getStockTotalProduit(produit: ProduitResponse): number {
  return this.getStocksProduit(produit)
    .reduce((acc, x) => acc + Number(x.quantiteDisponible || 0), 0);
}

getStockLabel(produit: ProduitResponse): string {
  const stocks = this.getStocksProduit(produit);

  if (!stocks.length) {
    return 'Aucun stock';
  }

  const total = this.getStockTotalProduit(produit);

  if (total <= 0) {
    return 'Rupture';
  }

  return `${this.formatNumber(total)} disponible`;
}

selectionnerStockProduit(produit: ProduitResponse, stock: ProduitPos): void {
  this.selectedStockByProduit.set(produit.id, stock);
}

getSelectedStock(produit: ProduitResponse): ProduitPos | null {
  return this.selectedStockByProduit.get(produit.id) || this.getStocksProduit(produit)[0] || null;
}

enregistrerVenteManquee(produit: ProduitResponse): void {
  if (!produit?.id) {
    this.toast.warning('Produit invalide.');
    return;
  }

  const stock = this.getSelectedStock(produit);

  if (!stock) {
    this.toast.warning('Veuillez sélectionner le dépôt ou l’emplacement concerné.');
    return;
  }

  const quantiteDemandee = 1;

  this.requisitionStore.enregistrerVenteManquee(
    produit.id,
    stock.depotId,
    stock.locatorId ?? null,
    quantiteDemandee,
    'ADMIN',
    `Vente manquée - ${stock.depotNom}${stock.locatorNom ? ' / ' + stock.locatorNom : ''}`
  );

  this.toast.success(`Vente manquée enregistrée : ${produit.nom}`);
}

formatNumber(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3
  }).format(Number(value || 0));
}

creerProduitPourVenteManquee(): void {
  const nomRecherche = this.searchTerm?.trim();

  const dialogRef = this.dialog.open(ProduitDialog, {
    width: '1000px',
    maxWidth: '96vw',
    disableClose: true,
    data: {
      mode: 'create',
      produit: {
        nom: nomRecherche || '',
        prixVente: 0,
        stockMinimum: 0,
        stockMaximum: 0,
        actif: true
      }
    }
  });

  dialogRef.afterClosed().subscribe((result: ProduitRequest | undefined) => {
    if (!result) return;

    this.loading = true;

    this.produitService.create(result).subscribe({
      next: (newProduit) => {
        this.produitStore.addOne(newProduit);
        this.requisitionStore.enregistrerNouveauProduitDemande(
          newProduit.id,
          null,
          null,
          1,
          'ADMIN',
          'Nouveau produit demandé par client - vente manquée'
        );
        this.toast.success('Produit créé et vente manquée enregistrée.');
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.toast.error('Erreur création produit.');
        this.loading = false;
      }
    });
  });
}

}
