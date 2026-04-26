import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { PeremptionService } from './peremption-service';
import { AlertePeremption } from '../../models/alerte-peremption.model';
import { DashboardPeremption } from '../../models/dashboard-peremption.model';
import { StockLot } from '../../models/stock-lot.model';

export interface LotFilters {
  depotId?: number | null;
  produit?: string | null;
  statut?: string | null;
  uniquementDisponibles?: boolean | null;
  recherche?: string | null;
}

export interface AlerteFilters {
  depotNom?: string | null;
  produit?: string | null;
  statut?: string | null;
  niveauAlerte?: string | null;
  recherche?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class PeremptionStore {
  private api = inject(PeremptionService);

  readonly loading = signal(false);
  readonly loadingLots = signal(false);
  readonly loadingAlertes = signal(false);
  readonly loadingDashboard = signal(false);
  readonly recalculLoading = signal(false);

  readonly allLots = signal<StockLot[]>([]);
  readonly filteredLots = signal<StockLot[]>([]);

  readonly allAlertes = signal<AlertePeremption[]>([]);
  readonly filteredAlertes = signal<AlertePeremption[]>([]);

  readonly dashboard = signal<DashboardPeremption | null>(null);

  readonly lotFilters = signal<LotFilters>({
    depotId: null,
    produit: '',
    statut: '',
    uniquementDisponibles: true,
    recherche: ''
  });

  readonly alerteFilters = signal<AlerteFilters>({
    depotNom: '',
    produit: '',
    statut: '',
    niveauAlerte: '',
    recherche: ''
  });

  readonly totalLots = computed(() => this.filteredLots().length);
  readonly totalLotsGlobal = computed(() => this.allLots().length);

  readonly totalAlertes = computed(() => this.filteredAlertes().length);
  readonly totalAlertesGlobal = computed(() => this.allAlertes().length);

  readonly totalLotsPerimes = computed(() =>
    this.filteredLots().filter(l => l.statutPeremption === 'PERIME').length
  );

  readonly totalLotsValides = computed(() =>
    this.filteredLots().filter(l => l.statutPeremption === 'VALIDE').length
  );

  readonly totalLotsAlerte = computed(() =>
    this.filteredLots().filter(l => l.statutPeremption !== 'VALIDE').length
  );

  loadDashboard(): void {
    this.loadingDashboard.set(true);

    this.api.getDashboard()
      .pipe(finalize(() => this.loadingDashboard.set(false)))
      .subscribe({
        next: (data) => {
          this.dashboard.set(data)
          console.log('Dashboard :', data)
        },

        error: () => this.dashboard.set(null)
      });
  }

  loadLots(): void {
    this.loading.set(true);
    this.loadingLots.set(true);
    this.api.getLots()
      .pipe(finalize(() => {
        this.loading.set(false);
        this.loadingLots.set(false);
      }))
      .subscribe({
        next: (data) => {
          const lots = data ?? [];
          this.allLots.set(lots);
          this.applyLotFilters();
          console.log('Lots chargés :', data)
        },
        error: () => {
          this.allLots.set([]);
          this.filteredLots.set([]);
        }
      });
  }

loadAlertes(): void {
  this.loading.set(true);
  this.loadingAlertes.set(true);

  this.api.getAlertes()
    .pipe(finalize(() => {
      this.loading.set(false);
      this.loadingAlertes.set(false);
    }))
    .subscribe({
      next: (data) => {
        const alertes = data ?? [];

        console.log('=== ALERTES API ===');
        console.log(alertes);
        console.log('Total alertes reçues :', alertes.length);

        this.allAlertes.set(alertes);

        // TEST SANS FILTRE
        this.filteredAlertes.set(alertes);

        console.log('=== ALERTES TABLEAU ===');
        console.log(this.filteredAlertes());
      },
      error: (err) => {
        console.error('Erreur loadAlertes :', err);
        this.allAlertes.set([]);
        this.filteredAlertes.set([]);
      }
    });
}

  loadAll(): void {
    this.loadDashboard();
    this.loadLots();
    this.loadAlertes();
  }

  refreshAll(): void {
    this.loadAll();
  }

  recalculer(): void {
    this.recalculLoading.set(true);
    this.api.recalculerStatuts()
      .pipe(finalize(() => this.recalculLoading.set(false)))
      .subscribe({
        next: () => this.refreshAll()
      });
  }

  setLotFilters(filters: Partial<LotFilters>): void {
    this.lotFilters.update(current => ({
      ...current,
      ...filters
    }));
    this.applyLotFilters();
  }

  resetLotFilters(): void {
    this.lotFilters.set({
      depotId: null,
      produit: '',
      statut: '',
      uniquementDisponibles: true,
      recherche: ''
    });
    this.applyLotFilters();
  }

  applyLotFilters(): void {
    const filtered = this.api.filtrerLots(this.allLots(), this.lotFilters());
    this.filteredLots.set(filtered);
  }

  sortLots(
    champ: 'produitNom' | 'depotNom' | 'datePeremption' | 'quantiteDisponible' | 'coutUnitaireFinal' | 'joursRestants',
    direction: 'asc' | 'desc' = 'asc'
  ): void {
    const sorted = this.api.trierLots(this.filteredLots(), champ, direction);
    this.filteredLots.set(sorted);
  }

  showOnlyLotsEnAlerte(): void {
    const lots = this.api.extraireLotsEnAlerte(this.allLots());
    this.filteredLots.set(lots);
  }

  showOnlyLotsPerimes(): void {
    const lots = this.api.extraireLotsPerimes(this.allLots());
    this.filteredLots.set(lots);
  }

  restoreAllLots(): void {
    this.applyLotFilters();
  }

  setAlerteFilters(filters: Partial<AlerteFilters>): void {
    this.alerteFilters.update(current => ({
      ...current,
      ...filters
    }));
    this.applyAlerteFilters();
  }

  resetAlerteFilters(): void {
    this.alerteFilters.set({
      depotNom: '',
      produit: '',
      statut: '',
      niveauAlerte: '',
      recherche: ''
    });
    this.applyAlerteFilters();
  }

  applyAlerteFilters(): void {
    const filtered = this.api.filtrerAlertes(this.allAlertes(), this.alerteFilters());
    this.filteredAlertes.set(filtered);
  }

  restoreAllAlertes(): void {
    this.applyAlerteFilters();
  }

  getLotByIdFromCache(id: number): StockLot | null {
    return this.allLots().find(l => l.id === id) ?? null;
  }

  reloadLotsOnly(): void {
    this.loadLots();
  }

  reloadAlertesOnly(): void {
    this.loadAlertes();
  }

  reloadDashboardOnly(): void {
    this.loadDashboard();
  }
}
