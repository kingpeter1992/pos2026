import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, of, shareReplay, tap, finalize } from 'rxjs';
import { MouvementStockView } from '../../models/mouvementStockView';
import { MouvementStockService } from './mouvement-stock-service';

@Injectable({ providedIn: 'root' })
export class ServiceMouvementStockStore {
  private mouvementService = inject(MouvementStockService);

  private mouvementsSignal = signal<MouvementStockView[]>([]);
  private loadingSignal = signal<boolean>(false);
  private loadedSignal = signal<boolean>(false);

  private currentRequest$: Observable<MouvementStockView[]> | null = null;

  mouvements = this.mouvementsSignal.asReadonly();
  loading = this.loadingSignal.asReadonly();
  loaded = this.loadedSignal.asReadonly();

  totalItems = computed(() => this.mouvements().length);

  totalEntrees = computed(() =>
    this.mouvements().filter(m => m.typeMouvement?.includes('ENTREE')).length
  );

  totalSorties = computed(() =>
    this.mouvements().filter(m => m.typeMouvement?.includes('SORTIE')).length
  );

  totalQuantiteEntree = computed(() =>
    this.mouvements()
      .filter(m => m.typeMouvement?.includes('ENTREE'))
      .reduce((sum, m) => sum + Number(m.quantite || 0), 0)
  );

  totalQuantiteSortie = computed(() =>
    this.mouvements()
      .filter(m => m.typeMouvement?.includes('SORTIE'))
      .reduce((sum, m) => sum + Number(m.quantite || 0), 0)
  );

  loadIfNeeded(): Observable<MouvementStockView[]> {
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
        console.log('Mouvements de stock chargés :', this.mouvementsSignal());
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

  refresh(): Observable<MouvementStockView[]> {
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
): MouvementStockView[] {
  const term = (search ?? '').trim().toLowerCase();
  const start = dateDebut ? new Date(dateDebut) : null;
  const end = dateFin ? new Date(dateFin + 'T23:59:59') : null;

  return this.mouvements().filter(m => {
    const dateMouvement = m.dateMouvement ? new Date(m.dateMouvement) : null;

    const matchSearch =
      !term ||
      (m.nomProduit ?? '').toLowerCase().includes(term) ||
      (m.codeBarres ?? '').toLowerCase().includes(term) ||
      (m.referenceDocument ?? '').toLowerCase().includes(term) ||
      (m.libelle ?? '').toLowerCase().includes(term);

    const matchDepot = !depot || m.nomDepot === depot;
    const matchType = !type || m.typeMouvement === type;

    const matchDateDebut = !start || (dateMouvement && dateMouvement >= start);
    const matchDateFin = !end || (dateMouvement && dateMouvement <= end);

    return matchSearch && matchDepot && matchType && matchDateDebut && matchDateFin;
  });
}
}
