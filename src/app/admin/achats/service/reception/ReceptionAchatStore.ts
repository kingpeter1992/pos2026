import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, finalize, shareReplay, tap } from 'rxjs/operators';
import { ReceptionAchatResponse, ReceptionAchatRequest } from '../../models/reception-achat.model';
import { CommandeAchatStore } from '../achat/CommandeAchatStore';
import { ReceptionAchat } from './reception-achat';
// optionnel si tu as un StockStore
// import { StockStore } from '../../stock/store/stock.store';

@Injectable({
  providedIn: 'root'
})
export class ReceptionAchatStore {

  private readonly receptionsSubject = new BehaviorSubject<ReceptionAchatResponse[]>([]);
  readonly receptions$ = this.receptionsSubject.asObservable();

  private readonly selectedReceptionSubject = new BehaviorSubject<ReceptionAchatResponse | null>(null);
  readonly selectedReception$ = this.selectedReceptionSubject.asObservable();

  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  readonly loading$ = this.loadingSubject.asObservable();

  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  readonly error$ = this.errorSubject.asObservable();

  private loaded = false;
  private currentRequest$: Observable<ReceptionAchatResponse[]> | null = null;

  constructor(
    private api: ReceptionAchat,
    private commandeStore: CommandeAchatStore,
    // private stockStore: StockStore // si tu l’as
  ) {}

  // =========================
  // LOAD LIST
  // =========================
  loadIfNeeded(): Observable<ReceptionAchatResponse[]> {
    if (this.loaded && this.receptionsSubject.value.length > 0) {
      return of(this.receptionsSubject.value);
    }

    if (this.currentRequest$) {
      return this.currentRequest$;
    }

    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.currentRequest$ = this.api.getAll().pipe(
      tap((data) => {
        this.receptionsSubject.next(data);
        this.loaded = true;
        console.log('Réceptions d\'achat chargées', data);
      }),
      catchError((err) => {
        this.errorSubject.next(
          err?.error?.message || 'Erreur lors du chargement des réceptions.'
        );
        return throwError(() => err);
      }),
      finalize(() => {
        this.loadingSubject.next(false);
        this.currentRequest$ = null;
      }),
      shareReplay(1)
    );

    return this.currentRequest$;
  }


  getByIdFromCache(id: number): ReceptionAchatResponse | null {
  return this.receptionsSubject.value.find(r => Number(r.id) === Number(id)) ?? null;
}
  reload(): Observable<ReceptionAchatResponse[]> {
    this.loaded = false;
    return this.loadIfNeeded();
  }

  // =========================
  // LOAD BY ID
  // =========================
  loadById(id: number): Observable<ReceptionAchatResponse> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.api.getById(id).pipe(
      tap((reception) => {
        this.selectedReceptionSubject.next(reception);
      }),
      catchError((err) => {
        this.errorSubject.next(
          err?.error?.message || 'Erreur lors du chargement de la réception.'
        );
        return throwError(() => err);
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  // =========================
  // LOAD BY COMMANDE
  // =========================
  loadByCommande(commandeId: number): Observable<ReceptionAchatResponse[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.api.findByCommande(commandeId).pipe(
      tap((data) => {
        this.receptionsSubject.next(data);
      }),
      catchError((err) => {
        this.errorSubject.next(
          err?.error?.message || 'Erreur lors du chargement des réceptions de la commande.'
        );
        return throwError(() => err);
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  // =========================
  // CREATE
  // =========================
// =========================
// CREATE
// =========================
create(request: ReceptionAchatRequest): Observable<ReceptionAchatResponse> {
  this.loadingSubject.next(true);
  this.errorSubject.next(null);

  return this.api.creer(request).pipe(
    tap((created) => {
      this.receptionsSubject.next([created, ...this.receptionsSubject.value]);
      this.loaded = true;

      const commandeId = created?.commandeAchatId ?? request.commandeAchatId;

      if (commandeId != null) {
        this.commandeStore.loadById(commandeId).subscribe({
          error: () => {}
        });
      }
    }),
    catchError((err) => {
      this.errorSubject.next(
        err?.error?.message || 'Erreur lors de la création de la réception.'
      );
      return throwError(() => err);
    }),
    finalize(() => this.loadingSubject.next(false))
  );
}

  // =========================
  // UPSERT LOCAL
  // =========================
  upsertReception(reception: ReceptionAchatResponse): void {
    const list = [...this.receptionsSubject.value];
    const index = list.findIndex(r => r.id === reception.id);

    if (index >= 0) {
      list[index] = reception;
    } else {
      list.unshift(reception);
    }

    this.receptionsSubject.next(list);

    const selected = this.selectedReceptionSubject.value;
    if (selected && selected.id === reception.id) {
      this.selectedReceptionSubject.next(reception);
    }
  }

  clearSelected(): void {
    this.selectedReceptionSubject.next(null);
  }

  get snapshot(): ReceptionAchatResponse[] {
    return this.receptionsSubject.value;
  }
}
