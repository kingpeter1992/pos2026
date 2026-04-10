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
    'quantite',
    'min',
    'max',
    'pmp',
    'valeur',
    'statut'
  ];

  readonly loading = this.stockStore.loading;
  readonly stocks = this.stockStore.stocks;
  readonly depots = this.stockStore.depots;

  readonly totalProduits = this.stockStore.totalItems;
  readonly totalQuantite = this.stockStore.totalQuantite;
  readonly totalValeur = this.stockStore.totalValeurStock;
  readonly totalRuptures = this.stockStore.totalRuptures;
  readonly totalAlertesRupture = this.stockStore.totalAlertesRupture;
  readonly totalSurplus = this.stockStore.totalSurplus;
  readonly totalNormaux = this.stockStore.totalNormaux;

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

  trackByProduitDepot = (_index: number, row: StockProduitView): string =>
    `${row.produitId}-${row.depotId}`;
}

