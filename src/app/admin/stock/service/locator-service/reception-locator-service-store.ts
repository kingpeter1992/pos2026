import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap, finalize, shareReplay } from 'rxjs';

import { ReceptionLocatorPreparationResponse, ReceptionLocatorRequest } from '../../models/reception-locator.model';
import { ReceptionLocatorService } from './reception-locator-service';
@Injectable({
  providedIn: 'root'
})
export class ReceptionLocatorServiceStore {
  private readonly service = inject(ReceptionLocatorService);

  private readonly _loading = signal(false);
  private readonly _submitting = signal(false);
  private readonly _current = signal<ReceptionLocatorPreparationResponse | null>(null);

  private pendingLoad$?: Observable<ReceptionLocatorPreparationResponse>;

  readonly loading = computed(() => this._loading());
  readonly submitting = computed(() => this._submitting());
  readonly current = computed(() => this._current());

  load(receptionId: number): Observable<ReceptionLocatorPreparationResponse> {
    this._loading.set(true);

    const request$ = this.service.getPreparation(receptionId).pipe(
      tap(response => {
        this._current.set(response);
      }),
      finalize(() => {
        this._loading.set(false);
        this.pendingLoad$ = undefined;
      }),
      shareReplay(1)
    );

    this.pendingLoad$ = request$;
    return request$;
  }

  loadIfNeeded(receptionId: number): Observable<ReceptionLocatorPreparationResponse> {
    const current = this._current();

    if (current && current.receptionId === receptionId) {
      return new Observable(observer => {
        observer.next(current);
        observer.complete();
      });
    }

    if (this.pendingLoad$) {
      return this.pendingLoad$;
    }

    return this.load(receptionId);
  }

  refresh(receptionId: number): Observable<ReceptionLocatorPreparationResponse> {
    return this.load(receptionId);
  }

  save(receptionId: number, payload: ReceptionLocatorRequest): Observable<void> {
    this._submitting.set(true);

    return this.service.save(receptionId, payload).pipe(
      finalize(() => {
        this._submitting.set(false);
      })
    );
  }

  clear(): void {
    this._current.set(null);
    this.pendingLoad$ = undefined;
  }
}
