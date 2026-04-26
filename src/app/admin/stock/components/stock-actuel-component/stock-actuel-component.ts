import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ServiceStockStore } from '../../service/stock-service/service-stock.store';
import { StockProduitView } from '../../models/stock-produit.model';

@Component({
  selector: 'app-stock-actuel-component',
  templateUrl: './stock-actuel-component.html',
  styleUrl: './stock-actuel-component.css',
  standalone: false
})
export class StockActuelComponent implements OnInit {

  private readonly stockStore = inject(ServiceStockStore);

  readonly displayedColumns: string[] = [
    'produit',
    'codeBarre',
    'categorie',
    'depot',
      'emplacement',
    'quantite',
    'min',
    'max',
    'pmp',
    'tauxMarge',
    'margeUnitaire',
    'prixVenteUnitaire',
    'margeTotaleStock',
    'valeur',
    'statut'
  ];

  readonly loading = this.stockStore.loading;
  readonly stocks = this.stockStore.stocks;
  readonly depots = this.stockStore.depots;

  readonly search = signal<string>('');
  readonly depotFilter = signal<string>('');
  readonly statutFilter = signal<string>('');

  readonly filteredStocks = computed(() =>
    this.stockStore.filterStocks(
      this.search(),
      this.depotFilter(),
      this.statutFilter()
    )
  );

  // KPI dynamiques basées sur les lignes affichées
  readonly totalProduits = computed(() => this.filteredStocks().length);

  readonly totalQuantite = computed(() =>
    this.filteredStocks().reduce(
      (sum, row) => sum + Number(row.quantiteDisponible ?? 0),
      0
    )
  );

  // Représente le coût de revient total du stock
  readonly totalRevient = computed(() =>
    this.filteredStocks().reduce(
      (sum, row) => sum + Number(row.valeurStock ?? 0),
      0
    )
  );

  readonly totalMarge = computed(() =>
    this.filteredStocks().reduce(
      (sum, row) => sum + Number(row.margeTotaleStock ?? 0),
      0
    )
  );

  readonly totalValeurVente = computed(() =>
    this.filteredStocks().reduce((sum, row) => {
      const quantite = Number(row.quantiteDisponible ?? 0);
      const pv = Number(row.prixVenteUnitaire ?? 0);
      return sum + (quantite * pv);
    }, 0)
  );

  readonly totalRuptures = computed(() =>
    this.filteredStocks().filter(row => this.getResolvedStatut(row) === 'RUPTURE').length
  );

  readonly totalAlertesRupture = computed(() =>
    this.filteredStocks().filter(row => this.getResolvedStatut(row) === 'ALERTE_RUPTURE').length
  );

  readonly totalSurplus = computed(() =>
    this.filteredStocks().filter(row => this.getResolvedStatut(row) === 'SURPLUS').length
  );

  readonly totalNormaux = computed(() =>
    this.filteredStocks().filter(row => this.getResolvedStatut(row) === 'NORMAL').length
  );

  ngOnInit(): void {
    this.stockStore.loadIfNeeded().subscribe();
  }

  refresh(): void {
    this.stockStore.refresh().subscribe();
  }

  onSearchChange(value: string): void {
    this.search.set((value ?? '').trim());
  }

  onDepotChange(value: string): void {
    this.depotFilter.set(value ?? '');
  }

  onStatutChange(value: string): void {
    this.statutFilter.set(value ?? '');
  }

  getResolvedStatut(row: StockProduitView): 'RUPTURE' | 'ALERTE_RUPTURE' | 'SURPLUS' | 'NORMAL' {
    return this.stockStore.resolveStatut(row);
  }

  getBadgeClass(statut: string): string {
    switch (statut) {
      case 'RUPTURE':
        return 'badge-danger';
      case 'ALERTE_RUPTURE':
        return 'badge-warning';
      case 'SURPLUS':
        return 'badge-info';
      default:
        return 'badge-success';
    }
  }

  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'RUPTURE':
        return 'Rupture';
      case 'ALERTE_RUPTURE':
        return 'Sous stock';
      case 'SURPLUS':
        return 'Surstock';
      default:
        return 'Normal';
    }
  }

  formatNumber(value: number | string | null | undefined): string {
    return Number(value ?? 0).toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  formatPercent(value: number | string | null | undefined): string {
    return `${this.formatNumber(value)} %`;
  }

  trackByProduitDepot = (_index: number, row: StockProduitView): string =>
    `${row.produitId}-${row.depotId}`;
}

