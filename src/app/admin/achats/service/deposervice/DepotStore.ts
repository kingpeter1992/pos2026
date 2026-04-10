import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, finalize } from 'rxjs/operators';
import { DepotResponse } from '../../models/reception-achat.model';
import { DepotApiService } from './depot-api-service';
@Injectable({
  providedIn: 'root'
})
export class DepotStore {

  private depotsSubject = new BehaviorSubject<DepotResponse[]>([]);
  depots$ = this.depotsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  error$ = this.errorSubject.asObservable();

  private loaded = false;
  private currentRequest$: Observable<DepotResponse[]> | null = null;

  constructor(private api: DepotApiService) {}

  // =========================
  // LOAD ALL (avec cache)
  // =========================
  loadAll(): Observable<DepotResponse[]> {

    if (this.loaded) {
      return of(this.depotsSubject.value);
    }

    if (this.currentRequest$) {
      return this.currentRequest$;
    }

    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.currentRequest$ = this.api.getAll().pipe(
      tap((data) => {
        this.depotsSubject.next(data || []);
        this.loaded = true;
      }),
      catchError((err) => {
        this.errorSubject.next(
          err?.error?.message || 'Erreur lors du chargement des dépôts.'
        );
        return of([]);
      }),
      finalize(() => {
        this.loadingSubject.next(false);
        this.currentRequest$ = null;
      })
    );

    return this.currentRequest$;
  }

  // =========================
  // FORCE RELOAD
  // =========================
  reload(): Observable<DepotResponse[]> {
    this.loaded = false;
    return this.loadAll();
  }

  // =========================
  // GET BY ID (cache)
  // =========================
  getById(id: number): DepotResponse | undefined {
    return this.depotsSubject.value.find(d => Number(d.id) === Number(id));
  }

  // =========================
  // LOAD IF NEEDED
  // =========================
  loadIfNeeded(): Observable<DepotResponse[]> {
    if (this.loaded) {
      return of(this.depotsSubject.value);
    }
    return this.loadAll();
  }

}
