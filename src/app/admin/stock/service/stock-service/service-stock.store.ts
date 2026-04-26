import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { finalize, shareReplay, tap } from 'rxjs/operators';
import { StockProduitService } from './stock-produit.service';
import { ProvisionStockDashboardResponse, ProvisionStockResponse, StockProduitView } from '../../models/stock-produit.model';

@Injectable({
  providedIn: 'root'
})
export class ServiceStockStore {
  private stockService = inject(StockProduitService);

  private readonly stocksSignal = signal<StockProduitView[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly loadedSignal = signal<boolean>(false);

  private readonly provisionDashboardSignal = signal<ProvisionStockDashboardResponse | null>(null);
  private readonly provisionLinesSignal = signal<ProvisionStockResponse[]>([]);
  private readonly provisionLoadingSignal = signal<boolean>(false);
  private readonly provisionLoadedSignal = signal<boolean>(false);

  private currentRequest$: Observable<StockProduitView[]> | null = null;
  private currentProvisionRequest$: Observable<ProvisionStockDashboardResponse> | null = null;

  readonly stocks = this.stocksSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly loaded = this.loadedSignal.asReadonly();

  readonly provisionDashboard = this.provisionDashboardSignal.asReadonly();
  readonly provisionLines = this.provisionLinesSignal.asReadonly();
  readonly provisionLoading = this.provisionLoadingSignal.asReadonly();
  readonly provisionLoaded = this.provisionLoadedSignal.asReadonly();

  readonly totalItems = computed(() => this.stocks().length);

  readonly totalQuantite = computed(() =>
    this.stocks().reduce((sum, item) => sum + Number(item?.quantiteDisponible ?? 0), 0)
  );

  readonly totalValeurStock = computed(() =>
    this.stocks().reduce((sum, item) => sum + Number(item?.valeurStock ?? 0), 0)
  );

  readonly totalRuptures = computed(() =>
    this.stocks().filter(item => this.resolveStatut(item) === 'RUPTURE').length
  );

  readonly totalAlertesRupture = computed(() =>
    this.stocks().filter(item => this.resolveStatut(item) === 'ALERTE_RUPTURE').length
  );

  readonly totalSurplus = computed(() =>
    this.stocks().filter(item => this.resolveStatut(item) === 'SURPLUS').length
  );

  readonly totalNormaux = computed(() =>
    this.stocks().filter(item => this.resolveStatut(item) === 'NORMAL').length
  );

  readonly stocksEnRupture = computed(() =>
    this.stocks().filter(item => this.resolveStatut(item) === 'RUPTURE')
  );

  readonly stocksEnAlerteRupture = computed(() =>
    this.stocks().filter(item => this.resolveStatut(item) === 'ALERTE_RUPTURE')
  );

  readonly stocksEnSurplus = computed(() =>
    this.stocks().filter(item => this.resolveStatut(item) === 'SURPLUS')
  );

  readonly stocksNormaux = computed(() =>
    this.stocks().filter(item => this.resolveStatut(item) === 'NORMAL')
  );

  readonly depots = computed(() =>
    [...new Set(this.stocks().map(item => item?.nomDepot).filter(Boolean))].sort()
  );

  // =========================
  // PROVISION
  // =========================

  readonly totalValeurProvisionStock = computed(() =>
    Number(this.provisionDashboard()?.valeurStockTotale ?? 0)
  );

  readonly totalProvision = computed(() =>
    Number(this.provisionDashboard()?.provisionTotale ?? 0)
  );

  readonly totalProduitsProvision = computed(() =>
    Number(this.provisionDashboard()?.nombreProduits ?? 0)
  );

  readonly totalProduitsProvisionnes = computed(() =>
    Number(this.provisionDashboard()?.nombreProduitsProvisionnes ?? 0)
  );

  readonly provisionCategories = computed(() =>
    [...new Set(this.provisionLines().map(item => item?.categorieNom).filter(Boolean))].sort()
  );

  readonly totalProvisionFaible = computed(() =>
    this.provisionLines().filter(item => item.niveauRisque === 'FAIBLE').length
  );

  readonly totalProvisionMoyen = computed(() =>
    this.provisionLines().filter(item => item.niveauRisque === 'MOYEN').length
  );

  readonly totalProvisionEleve = computed(() =>
    this.provisionLines().filter(item => item.niveauRisque === 'ELEVE').length
  );

  readonly totalProvisionTotal = computed(() =>
    this.provisionLines().filter(item => item.niveauRisque === 'TOTAL').length
  );

  loadIfNeeded(): Observable<StockProduitView[]> {
    if (this.loadedSignal()) {
      return of(this.stocksSignal());
    }

    if (this.currentRequest$) {
      return this.currentRequest$;
    }

    this.loadingSignal.set(true);

    this.currentRequest$ = this.stockService.getAll().pipe(
      tap((data) => {
        this.stocksSignal.set(data ?? []);
        this.loadedSignal.set(true);
        console.log('Stocks loaded:', data);
      }),
      finalize(() => {
        this.loadingSignal.set(false);
        this.currentRequest$ = null;
      }),
      shareReplay(1)
    );

    return this.currentRequest$;
  }

  refresh(): Observable<StockProduitView[]> {
    this.loadingSignal.set(true);
    this.loadedSignal.set(false);

    this.currentRequest$ = this.stockService.getAll().pipe(
      tap((data) => {
        this.stocksSignal.set(data ?? []);
        this.loadedSignal.set(true);
      }),
      finalize(() => {
        this.loadingSignal.set(false);
        this.currentRequest$ = null;
      }),
      shareReplay(1)
    );

    return this.currentRequest$;
  }

  loadProvisionIfNeeded(): Observable<ProvisionStockDashboardResponse> {
    if (this.provisionLoadedSignal()) {
      return of(this.provisionDashboardSignal() as ProvisionStockDashboardResponse);
    }

    if (this.currentProvisionRequest$) {
      return this.currentProvisionRequest$;
    }

    this.provisionLoadingSignal.set(true);

    this.currentProvisionRequest$ = this.stockService.getDashboardProvision().pipe(
      tap((data) => {
        this.provisionDashboardSignal.set(data);
        this.provisionLinesSignal.set(data?.lignes ?? []);
        this.provisionLoadedSignal.set(true);
      }),
      finalize(() => {
        this.provisionLoadingSignal.set(false);
        this.currentProvisionRequest$ = null;
      }),
      shareReplay(1)
    );

    return this.currentProvisionRequest$;
  }

  refreshProvision(): Observable<ProvisionStockDashboardResponse> {
    this.provisionLoadingSignal.set(true);
    this.provisionLoadedSignal.set(false);

    this.currentProvisionRequest$ = this.stockService.getDashboardProvision().pipe(
      tap((data) => {
        this.provisionDashboardSignal.set(data);
        this.provisionLinesSignal.set(data?.lignes ?? []);
        this.provisionLoadedSignal.set(true);
      }),
      finalize(() => {
        this.provisionLoadingSignal.set(false);
        this.currentProvisionRequest$ = null;
      }),
      shareReplay(1)
    );

    return this.currentProvisionRequest$;
  }

  setStocks(data: StockProduitView[]): void {
    this.stocksSignal.set(data ?? []);
    this.loadedSignal.set(true);
  }

  resolveStatut(item: StockProduitView): 'RUPTURE' | 'ALERTE_RUPTURE' | 'SURPLUS' | 'NORMAL' {
    const quantite = Number(item?.quantiteDisponible ?? 0);
    const min = Number(item?.stockMinimum ?? 0);
    const max = Number(item?.stockMinimum ?? 0);

    if (quantite <= 0) return 'RUPTURE';
    if (min > 0 && quantite < min) return 'ALERTE_RUPTURE';
    if (max > 0 && quantite > max) return 'SURPLUS';
    return 'NORMAL';
  }

  clear(): void {
    this.stocksSignal.set([]);
    this.loadedSignal.set(false);
    this.loadingSignal.set(false);
    this.currentRequest$ = null;

    this.provisionDashboardSignal.set(null);
    this.provisionLinesSignal.set([]);
    this.provisionLoadedSignal.set(false);
    this.provisionLoadingSignal.set(false);
    this.currentProvisionRequest$ = null;
  }

  filterStocks(search = '', depot = '', statut = ''): StockProduitView[] {
  const term = (search ?? '').trim().toLowerCase();
  const depotValue = (depot ?? '').trim().toLowerCase();
  const statutValue = (statut ?? '').trim().toUpperCase();

  return this.stocks().filter(item => {
    const statutCourant = this.resolveStatut(item);

    const matchesSearch =
      !term ||
      (item?.nomProduit ?? '').toLowerCase().includes(term) ||
      (item?.codeBarre ?? '').toLowerCase().includes(term) ||
      (item?.categorie ?? '').toLowerCase().includes(term) ||
      (item?.nomDepot ?? '').toLowerCase().includes(term);

    const matchesDepot =
      !depotValue ||
      (item?.nomDepot ?? '').toLowerCase() === depotValue;

    const matchesStatut =
      !statutValue || statutCourant === statutValue;

    return matchesSearch && matchesDepot && matchesStatut;
  });
}
}
