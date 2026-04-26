import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, of, shareReplay, tap, finalize } from 'rxjs';
import { MouvementStockService } from './mouvement-stock-service';
import { TransactionStockView } from '../../models/TransactionStockView';

@Injectable({ providedIn: 'root' })
export class ServiceMouvementStockStore {
 private readonly mouvementService = inject(MouvementStockService);

  private readonly mouvementsSignal = signal<TransactionStockView[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly loadedSignal = signal<boolean>(false);

  private currentRequest$: Observable<TransactionStockView[]> | null = null;

  readonly mouvements = this.mouvementsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly loaded = this.loadedSignal.asReadonly();

  readonly totalItems = computed(() => this.mouvements().length);

  readonly totalEntrees = computed(() =>
    this.mouvements().filter(m => this.isEntree(m.typeTransaction)).length
  );

  readonly totalSorties = computed(() =>
    this.mouvements().filter(m => this.isSortie(m.typeTransaction)).length
  );

  readonly totalQuantiteEntree = computed(() =>
    this.mouvements()
      .filter(m => this.isEntree(m.typeTransaction))
      .reduce((sum, m) => sum + Number(m.quantite ?? 0), 0)
  );

  readonly totalQuantiteSortie = computed(() =>
    this.mouvements()
      .filter(m => this.isSortie(m.typeTransaction))
      .reduce((sum, m) => sum + Number(m.quantite ?? 0), 0)
  );

  loadIfNeeded(): Observable<TransactionStockView[]> {
    if (this.loadedSignal()) {
      return of(this.mouvementsSignal());
    }

    if (this.currentRequest$) {
      return this.currentRequest$;
    }

    this.loadingSignal.set(true);

    this.currentRequest$ = this.mouvementService.getAll().pipe(
      tap((data) => {
        this.mouvementsSignal.set(data ?? []);
        this.loadedSignal.set(true);
        console.log('Transactions de stock chargées :', this.mouvementsSignal());
      }),
      finalize(() => {
        this.loadingSignal.set(false);
        this.currentRequest$ = null;
      }),
      shareReplay(1)
    );

    return this.currentRequest$;
  }

  refresh(): Observable<TransactionStockView[]> {
    this.loadingSignal.set(true);

    const request$ = this.mouvementService.getAll().pipe(
      tap((data) => {
        this.mouvementsSignal.set(data ?? []);
        this.loadedSignal.set(true);
      }),
      finalize(() => {
        this.loadingSignal.set(false);
        this.currentRequest$ = null;
      }),
      shareReplay(1)
    );

    this.currentRequest$ = request$;
    return request$;
  }

  filterMouvements(
    search: string,
    depot: string,
    type: string,
    dateDebut?: string,
    dateFin?: string
  ): TransactionStockView[] {
    const term = (search ?? '').trim().toLowerCase();
    const start = dateDebut ? new Date(dateDebut) : null;
    const end = dateFin ? new Date(dateFin + 'T23:59:59') : null;

    return this.mouvements().filter(m => {
      const dateTransaction = m.dateTransaction ? new Date(m.dateTransaction) : null;

      const searchableText = [
        m.produitNom ?? '',
        m.depotNom ?? '',
        m.referenceDocument ?? '',
        m.sourceDocument ?? '',
        m.libelle ?? '',
        m.utilisateur ?? '',
        m.typeTransaction ?? ''
      ]
        .join(' ')
        .toLowerCase();

      const matchSearch = !term || searchableText.includes(term);
      const matchDepot = !depot || m.depotNom === depot;
      const matchType = !type || m.typeTransaction === type;

      const matchDateDebut = !start || (!!dateTransaction && dateTransaction >= start);
      const matchDateFin = !end || (!!dateTransaction && dateTransaction <= end);

      return matchSearch && matchDepot && matchType && matchDateDebut && matchDateFin;
    });
  }

  private isEntree(type: string | null | undefined): boolean {
    return (type ?? '').toUpperCase().includes('ENTREE');
  }

  private isSortie(type: string | null | undefined): boolean {
    return (type ?? '').toUpperCase().includes('SORTIE');
  }
}
