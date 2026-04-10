import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, finalize, shareReplay, tap } from 'rxjs/operators';
import { CommandeAchatStore } from '../achat/CommandeAchatStore';
import { FactureFournisseurResponse, FactureFournisseurRequest } from '../../models/facture-fournisseur.model';
import { ReceptionAchatStore } from '../reception/ReceptionAchatStore';
import { FactfseurService } from './factfseur-service';

@Injectable({
  providedIn: 'root'
})
export class FactureFournisseurStore {

  private readonly facturesSubject = new BehaviorSubject<FactureFournisseurResponse[]>([]);
  readonly factures$ = this.facturesSubject.asObservable();

  private readonly selectedFactureSubject = new BehaviorSubject<FactureFournisseurResponse | null>(null);
  readonly selectedFacture$ = this.selectedFactureSubject.asObservable();

  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  readonly loading$ = this.loadingSubject.asObservable();

  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  readonly error$ = this.errorSubject.asObservable();

  private loaded = false;
  private currentRequest$: Observable<FactureFournisseurResponse[]> | null = null;

  constructor(
    private api: FactfseurService,
    private commandeStore: CommandeAchatStore,
    private receptionStore: ReceptionAchatStore
  ) {}

  loadIfNeeded(): Observable<FactureFournisseurResponse[]> {
    if (this.loaded && this.facturesSubject.value.length > 0) {
      return of(this.facturesSubject.value);
    }

    if (this.currentRequest$) {
      return this.currentRequest$;
    }

    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.currentRequest$ = this.api.findAll().pipe(
      tap((data) => {
        this.facturesSubject.next(data);
        this.loaded = true;
      }),
      catchError((err) => {
        this.errorSubject.next(
          err?.error?.message || 'Erreur lors du chargement des factures fournisseurs.'
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

  reload(): Observable<FactureFournisseurResponse[]> {
    this.loaded = false;
    return this.loadIfNeeded();
  }

  loadById(id: number): Observable<FactureFournisseurResponse> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.api.getById(id).pipe(
      tap((facture) => {
        this.selectedFactureSubject.next(facture);
      }),
      catchError((err) => {
        this.errorSubject.next(
          err?.error?.message || 'Erreur lors du chargement de la facture fournisseur.'
        );
        return throwError(() => err);
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  create(request: FactureFournisseurRequest): Observable<FactureFournisseurResponse> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.api.creer(request).pipe(
      tap((created) => {
        this.facturesSubject.next([created, ...this.facturesSubject.value]);
        this.loaded = true;

        if (request.commandeAchatId) {
          this.commandeStore.loadById(request.commandeAchatId).subscribe({
            error: () => {}
          });
        }

        if (request.receptionId) {
          this.receptionStore.loadById(request.receptionId).subscribe({
            error: () => {}
          });
        }
      }),
      catchError((err) => {
        this.errorSubject.next(
          err?.error?.message || 'Erreur lors de la création de la facture fournisseur.'
        );
        return throwError(() => err);
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  upsertFacture(facture: FactureFournisseurResponse): void {
    const list = [...this.facturesSubject.value];
    const index = list.findIndex(f => f.id === facture.id);

    if (index >= 0) {
      list[index] = facture;
    } else {
      list.unshift(facture);
    }

    this.facturesSubject.next(list);

    const selected = this.selectedFactureSubject.value;
    if (selected && selected.id === facture.id) {
      this.selectedFactureSubject.next(facture);
    }
  }

  clearSelected(): void {
    this.selectedFactureSubject.next(null);
  }

  get snapshot(): FactureFournisseurResponse[] {
    return this.facturesSubject.value;
  }
}
