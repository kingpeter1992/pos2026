import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, finalize, shareReplay, tap } from 'rxjs/operators';
import { FournisseurService } from '../../../produits/service/fouisseur-service/fournisseur-service';
import { FournisseurRequest, FournisseurResponse } from '../../../produits/models/fournisseur.model';

@Injectable({
  providedIn: 'root'
})
export class FournisseurStore {

  private readonly fournisseursSubject = new BehaviorSubject<FournisseurResponse[]>([]);
  readonly fournisseurs$ = this.fournisseursSubject.asObservable();

  private readonly selectedFournisseurSubject = new BehaviorSubject<FournisseurResponse | null>(null);
  readonly selectedFournisseur$ = this.selectedFournisseurSubject.asObservable();

  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  readonly loading$ = this.loadingSubject.asObservable();

  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  readonly error$ = this.errorSubject.asObservable();

  private loaded = false;
  private currentRequest$: Observable<FournisseurResponse[]> | null = null;

  constructor(private fournisseurApi: FournisseurService) {}

  loadIfNeeded(): Observable<FournisseurResponse[]> {
    if (this.loaded && this.fournisseursSubject.value.length > 0) {
      return of(this.fournisseursSubject.value);
    }

    if (this.currentRequest$) {
      return this.currentRequest$;
    }

    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.currentRequest$ = this.fournisseurApi.getAll().pipe(
      tap((fournisseurs) => {
        this.fournisseursSubject.next(fournisseurs);
        this.loaded = true;
        console.log('Fournisseurs chargés', fournisseurs);
      }),
      catchError((err) => {
        this.errorSubject.next(
          err?.error?.message || 'Erreur lors du chargement des fournisseurs.'
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

  reload(): Observable<FournisseurResponse[]> {
    this.loaded = false;
    return this.loadIfNeeded();
  }

  loadById(id: number): Observable<FournisseurResponse> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.fournisseurApi.getById(id).pipe(
      tap((fournisseur) => {
        this.selectedFournisseurSubject.next(fournisseur);
      }),
      catchError((err) => {
        this.errorSubject.next(
          err?.error?.message || 'Erreur lors du chargement du fournisseur.'
        );
        return throwError(() => err);
      }),
      finalize(() => {
        this.loadingSubject.next(false);
      })
    );
  }

  delete(id: number): Observable<void> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.fournisseurApi.delete(id).pipe(
      tap(() => {
        const fournisseurs = this.fournisseursSubject.value.filter((item) => item.id !== id);
        this.fournisseursSubject.next(fournisseurs);

        const selected = this.selectedFournisseurSubject.value;
        if (selected && selected.id === id) {
          this.selectedFournisseurSubject.next(null);
        }
      }),
      catchError((err) => {
        this.errorSubject.next(
          err?.error?.message || 'Erreur lors de la suppression du fournisseur.'
        );
        return throwError(() => err);
      }),
      finalize(() => {
        this.loadingSubject.next(false);
      })
    );
  }

  clearSelected(): void {
    this.selectedFournisseurSubject.next(null);
  }

  get fournisseurSnapshot(): FournisseurResponse[] {
    return this.fournisseursSubject.value;
  }

create(request: FournisseurRequest): Observable<FournisseurResponse> {
  this.loadingSubject.next(true);
  this.errorSubject.next(null);

  return this.fournisseurApi.create(request).pipe(
    tap((created: FournisseurResponse) => {
      this.fournisseursSubject.next([created, ...this.fournisseursSubject.value]);
      this.loaded = true;
    }),
    catchError((err) => {
      this.errorSubject.next(
        err?.error?.message || 'Erreur lors de la création du fournisseur.'
      );
      return throwError(() => err);
    }),
    finalize(() => {
      this.loadingSubject.next(false);
    })
  );
}

update(id: number, request: FournisseurRequest): Observable<FournisseurResponse> {
  this.loadingSubject.next(true);
  this.errorSubject.next(null);

  return this.fournisseurApi.update(id, request).pipe(
    tap((updated: FournisseurResponse) => {
      const fournisseurs = this.fournisseursSubject.value.map((item) =>
        item.id === id ? updated : item
      );
      this.fournisseursSubject.next(fournisseurs);

      const selected = this.selectedFournisseurSubject.value;
      if (selected && selected.id === id) {
        this.selectedFournisseurSubject.next(updated);
      }
    }),
    catchError((err) => {
      this.errorSubject.next(
        err?.error?.message || 'Erreur lors de la modification du fournisseur.'
      );
      return throwError(() => err);
    }),
    finalize(() => {
      this.loadingSubject.next(false);
    })
  );
}

upsertFournisseur(fournisseur: FournisseurResponse): void {
  const fournisseurs = [...this.fournisseursSubject.value];
  const index = fournisseurs.findIndex((item) => item.id === fournisseur.id);

  if (index >= 0) {
    fournisseurs[index] = fournisseur;
  } else {
    fournisseurs.unshift(fournisseur);
  }

  this.fournisseursSubject.next(fournisseurs);

  const selected = this.selectedFournisseurSubject.value;
  if (selected && selected.id === fournisseur.id) {
    this.selectedFournisseurSubject.next(fournisseur);
  }
}
}
