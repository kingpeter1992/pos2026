import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { finalize, shareReplay, tap } from 'rxjs/operators';
import { StockProduitService } from './stock-produit.service';
import { StockProduitView } from '../../models/stock-produit.model';

@Injectable({
  providedIn: 'root'
})
export class ServiceStockStore {
  private stockService = inject(StockProduitService);

  private readonly stocksSignal = signal<StockProduitView[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly loadedSignal = signal<boolean>(false);

  private currentRequest$: Observable<StockProduitView[]> | null = null;

  readonly stocks = this.stocksSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly loaded = this.loadedSignal.asReadonly();

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
    [...new Set(this.stocks().map(item => item?.nomDepot).filter(Boolean))]
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
        console.log('Stocks chargés depuis la API', data);
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

  setStocks(data: StockProduitView[]): void {
    this.stocksSignal.set(data ?? []);
    this.loadedSignal.set(true);
  }

  getByProduitId(produitId: number): StockProduitView | undefined {
    return this.stocks().find(item => Number(item?.produitId) === Number(produitId));
  }

  getByStockId(stockId: number): StockProduitView | undefined {
    return this.stocks().find(item => Number(item?.stockId) === Number(stockId));
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

  resolveStatut(item: StockProduitView): 'RUPTURE' | 'ALERTE_RUPTURE' | 'SURPLUS' | 'NORMAL' {
    const quantite = Number(item?.quantiteDisponible ?? 0);
    const min = Number(item?.quantiteMinimale ?? 0);
    const max = Number(item?.quantiteMaximale ?? 0);

    if (quantite <= 0) {
      return 'RUPTURE';
    }

    if (min > 0 && quantite < min) {
      return 'ALERTE_RUPTURE';
    }

    if (max > 0 && quantite > max) {
      return 'SURPLUS';
    }

    return 'NORMAL';
  }

  clear(): void {
    this.stocksSignal.set([]);
    this.loadedSignal.set(false);
    this.loadingSignal.set(false);
    this.currentRequest$ = null;
  }
}
