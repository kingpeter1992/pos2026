import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, tap } from 'rxjs/operators';
import { TarifVenteService } from './tarif-vente.service';
import { Observable, of } from 'rxjs';
import { CreateTarifVenteRequest, TarifVente, UpdateTarifVenteRequest } from '../../../../models/tarif-vente.model';
import { TarifCategorieProduitRequest, TarifCategorieProduitResponse, TarificationLotRequest, TarificationProduitRequest, TarificationResponse } from '../../../produits/models/vente.model';

@Injectable({
  providedIn: 'root'
})
export class TarifVenteStore {
  private readonly _loading = signal(false);
  private readonly _loaded = signal(false);
  private readonly _saving = signal(false);
  private readonly _items = signal<TarifVente[]>([]);

  private readonly _regles = signal<any[]>([]);
  private readonly _loadingRegles = signal(false);
  private readonly _reglesLoaded = signal(false);

  readonly loading = this._loading.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly items = this._items.asReadonly();

  readonly regles = this._regles.asReadonly();
  readonly loadingRegles = this._loadingRegles.asReadonly();
  readonly reglesLoaded = this._reglesLoaded.asReadonly();

  readonly actifs = computed(() => this._items().filter(x => !!x.actif));
  readonly inactifs = computed(() => this._items().filter(x => !x.actif));
  readonly tarifParDefaut = computed(() => this._items().find(x => x.parDefaut) ?? null);
  readonly total = computed(() => this._items().length);

  readonly tarifsActifs = computed(() =>
    this._items().filter(t => !!t.actif)
  );

  constructor(private service: TarifVenteService) {}

  load(force = false): Observable<TarifVente[]> {
    if (this._loaded() && !force) {
      return of(this._items());
    }

    this._loading.set(true);

    return this.service.getAll().pipe(
      tap((data) => {
        this._items.set(Array.isArray(data) ? data : []);
        this._loaded.set(true);
      }),
      finalize(() => this._loading.set(false))
    );
  }

  ensureTarifsLoaded(): Observable<TarifVente[]> {
    if (this._loaded()) {
      return of(this._items());
    }
    return this.load();
  }

  refresh(): Observable<TarifVente[]> {
    return this.load(true);
  }

  getById(id: number): TarifVente | undefined {
    return this._items().find(x => Number(x.id) === Number(id));
  }

  create(payload: CreateTarifVenteRequest): Observable<TarifVente> {
    this._saving.set(true);
    return this.service.create(payload).pipe(
      tap((created) => {
        let next = [...this._items(), created];

        if (created.parDefaut) {
          next = next.map(item => ({
            ...item,
            parDefaut: Number(item.id) === Number(created.id)
          }));
        }

        this._items.set(next);
      }),
      finalize(() => this._saving.set(false))
    );
  }

  update(id: number, payload: UpdateTarifVenteRequest): Observable<TarifVente> {
    this._saving.set(true);

    return this.service.update(id, payload).pipe(
      tap((updated) => {
        let next = this._items().map(item =>
          Number(item.id) === Number(id) ? updated : item
        );

        if (updated.parDefaut) {
          next = next.map(item => ({
            ...item,
            parDefaut: Number(item.id) === Number(updated.id)
          }));
        }

        this._items.set(next);
      }),
      finalize(() => this._saving.set(false))
    );
  }

  delete(id: number): Observable<void> {
    this._saving.set(true);

    return this.service.delete(id).pipe(
      tap(() => {
        this._items.set(this._items().filter(item => Number(item.id) !== Number(id)));
      }),
      finalize(() => this._saving.set(false))
    );
  }

  toggleActif(id: number): Observable<TarifVente> {
    this._saving.set(true);

    return this.service.toggleActif(id).pipe(
      tap((updated) => {
        this._items.set(
          this._items().map(item =>
            Number(item.id) === Number(id) ? updated : item
          )
        );
      }),
      finalize(() => this._saving.set(false))
    );
  }

  setParDefaut(id: number): Observable<TarifVente> {
    this._saving.set(true);

    return this.service.setParDefaut(id).pipe(
      tap((updated) => {
        this._items.set(
          this._items().map(item => ({
            ...item,
            parDefaut: Number(item.id) === Number(updated.id)
          }))
        );
      }),
      finalize(() => this._saving.set(false))
    );
  }

  loadReglesByTarif(tarifVenteId: number, force = false): Observable<any[]> {
    if (!force && this._reglesLoaded()) {
      const filtered = this._regles().filter(r =>
        Number(r.tarifVenteId) === Number(tarifVenteId)
      );
      return of(filtered);
    }

    this._loadingRegles.set(true);

    return this.service.getReglesByTarif(tarifVenteId).pipe(
      tap(data => {
        const list = Array.isArray(data) ? data : [];
        const others = this._regles().filter(r =>
          Number(r.tarifVenteId) !== Number(tarifVenteId)
        );
        this._regles.set([...others, ...list]);
        this._reglesLoaded.set(true);
      }),
      finalize(() => this._loadingRegles.set(false))
    );
  }

  loadReglesAll(force = false): Observable<any[]> {
    if (this._reglesLoaded() && !force) {
      return of(this._regles());
    }

    this._loadingRegles.set(true);

    return this.service.getAllRegles().pipe(
      tap(data => {
        this._regles.set(Array.isArray(data) ? data : []);
        this._reglesLoaded.set(true);
      }),
      finalize(() => this._loadingRegles.set(false))
    );
  }

  ensureReglesLoaded(): Observable<any[]> {
    if (this._reglesLoaded()) {
      return of(this._regles());
    }
    return this.loadReglesAll();
  }

  saveRegle(payload: TarifCategorieProduitRequest): Observable<TarifCategorieProduitResponse> {
    return this.service.createOrUpdateRegle(payload).pipe(
      tap((saved: TarifCategorieProduitResponse) => {
        this._regles.update(list => {
          const idx = list.findIndex(r =>
            Number(r.tarifVenteId) === Number(saved.tarifVenteId) &&
            Number(r.categorieId) === Number(saved.categorieId)
          );

          if (idx === -1) {
            return [saved, ...list];
          }

          const copy = [...list];
          copy[idx] = saved;
          return copy;
        });

        this._reglesLoaded.set(true);
      })
    );
  }

  calculerPrix(payload: TarificationProduitRequest): Observable<any> {
    return this.service.calculerPrix(payload);
  }

  calculerPrixLot(payload: TarificationLotRequest): Observable<any> {
    return this.service.calculerPrixLot(payload);
  }

}
