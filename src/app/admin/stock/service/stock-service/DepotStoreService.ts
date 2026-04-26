import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { finalize, shareReplay, tap } from 'rxjs/operators';
import { DepotDto, DepotService } from './depot.service';

@Injectable({
  providedIn: 'root'
})
export class DepotStoreService {
  private readonly depotService = inject(DepotService);

  private readonly depotsSignal = signal<DepotDto[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly loadedSignal = signal<boolean>(false);

  private currentRequest$: Observable<DepotDto[]> | null = null;

  readonly depots = this.depotsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly loaded = this.loadedSignal.asReadonly();

  readonly depotsActifs = computed(() =>
    this.depots().filter(d => d?.actif !== false)
  );

  readonly depotParDefaut = computed(() =>
    this.depotsActifs().find(d => d?.parDefaut === true)
    ?? this.depotsActifs()[0]
    ?? null
  );

  loadIfNeeded(): Observable<DepotDto[]> {
    if (this.loadedSignal()) {
      return of(this.depotsSignal());
    }

    if (this.currentRequest$) {
      return this.currentRequest$;
    }

    this.loadingSignal.set(true);

    this.currentRequest$ = this.depotService.getAll().pipe(
      tap((data) => {
        this.depotsSignal.set(Array.isArray(data) ? data : []);
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

  refresh(): Observable<DepotDto[]> {
    this.loadingSignal.set(true);

    const request$ = this.depotService.getAll().pipe(
      tap((data) => {
        this.depotsSignal.set(Array.isArray(data) ? data : []);
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

  getByIdFromCache(id: number | null | undefined): DepotDto | null {
    if (!id) return null;
    return this.depots().find(d => Number(d.id) === Number(id)) ?? null;
  }
}
