import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, finalize, tap } from 'rxjs';
import {
  CaisseSessionDto,
  CloturerCaisseDTO,
  OperationCaisseDTO,
  OuvrirCaisseDTO,
  TransactionCaisseDto
} from '../models/caisse.model';
import { CaisseService } from './caisse-service';
import { TauxChangeRequest, TauxChangeResponse } from '../models/taux-change.model';

@Injectable({
  providedIn: 'root'
})
export class CaisseStoreService {

  private readonly caisseService = inject(CaisseService);

  // =========================
  // STATE
  // =========================
  private readonly sessionSubject = new BehaviorSubject<CaisseSessionDto | null>(null);
  private readonly historiqueSubject = new BehaviorSubject<TransactionCaisseDto[]>([]);
  private readonly tauxSubject = new BehaviorSubject<number>(0);

  private readonly loadingSessionSubject = new BehaviorSubject<boolean>(false);
  private readonly loadingHistoriqueSubject = new BehaviorSubject<boolean>(false);
  private readonly loadingOperationSubject = new BehaviorSubject<boolean>(false);

  // =========================
  // OBSERVABLES
  // =========================
  readonly session$ = this.sessionSubject.asObservable();
  readonly historique$ = this.historiqueSubject.asObservable();

  readonly loadingSession$ = this.loadingSessionSubject.asObservable();
  readonly loadingHistorique$ = this.loadingHistoriqueSubject.asObservable();
  readonly loadingOperation$ = this.loadingOperationSubject.asObservable();

  private sessionLoaded = false;
  private historiqueLoaded = false;


  private readonly tauxListSubject = new BehaviorSubject<TauxChangeResponse[]>([]);
private readonly tauxActifSubject = new BehaviorSubject<TauxChangeResponse | null>(null);
private readonly dernierTauxSubject = new BehaviorSubject<number>(0);
private readonly loadingTauxSubject = new BehaviorSubject<boolean>(false);

readonly tauxList$ = this.tauxListSubject.asObservable();
readonly tauxActif$ = this.tauxActifSubject.asObservable();
readonly dernierTaux$ = this.dernierTauxSubject.asObservable();
readonly loadingTaux$ = this.loadingTauxSubject.asObservable();

private tauxLoaded = false;


  // =========================
  // SESSION OUVERTE
  // =========================
  loadSessionOuverte(force = false): Observable<CaisseSessionDto | null> {
    if (this.sessionLoaded && !force) {
      return of(this.sessionSubject.value);
    }

    this.loadingSessionSubject.next(true);

    return this.caisseService.sessionOuverte().pipe(
      tap(session => {
        this.sessionSubject.next(session);
        this.sessionLoaded = true;
      }),
      finalize(() => this.loadingSessionSubject.next(false))
    );
  }

  // =========================
  // OUVRIR CAISSE
  // =========================
  ouvrirCaisse(dto: OuvrirCaisseDTO): Observable<CaisseSessionDto> {
    this.loadingOperationSubject.next(true);
    return this.caisseService.ouvrir(dto).pipe(
      tap(session => {
        this.sessionSubject.next(session);
        this.sessionLoaded = true;
      }),
      finalize(() => this.loadingOperationSubject.next(false))
    );
  }

  // =========================
  // CLOTURER CAISSE
  // =========================
  cloturerCaisse(dto: CloturerCaisseDTO): Observable<CaisseSessionDto> {
    this.loadingOperationSubject.next(true);

    return this.caisseService.cloturer(dto).pipe(
      tap(session => {
        this.sessionSubject.next(session);
      }),
      finalize(() => this.loadingOperationSubject.next(false))
    );
  }

  // =========================
  // OPERATION STANDARD
  // =========================
  effectuerOperation(dto: OperationCaisseDTO): Observable<any> {
    this.loadingOperationSubject.next(true);

    return this.caisseService.operation(dto).pipe(
      tap(() => {
        this.refreshAll();
      }),
      finalize(() => this.loadingOperationSubject.next(false))
    );
  }

  effectuerOperationAutre(dto: OperationCaisseDTO): Observable<any> {
    this.loadingOperationSubject.next(true);
    return this.caisseService.operation(dto).pipe(
      tap(() => this.refreshAll()),
      finalize(() => this.loadingOperationSubject.next(false))
    );
  }

  // =========================
  // HISTORIQUE
  // =========================
  loadHistoriqueDuJour(force = false): Observable<TransactionCaisseDto[]> {
    if (this.historiqueLoaded && !force) {
      return of(this.historiqueSubject.value);
    }

    this.loadingHistoriqueSubject.next(true);

    return this.caisseService.historiqueDuJour().pipe(
      tap(data => {
        this.historiqueSubject.next(data);
        this.historiqueLoaded = true;
      }),
      finalize(() => this.loadingHistoriqueSubject.next(false))
    );
  }


  // =========================
  // REPORT
  // =========================
  getReport(dateFrom: string, dateTo: string) {
    return this.caisseService.getCaisseReport(dateFrom, dateTo);
  }

  // =========================
  // REFRESH GLOBAL
  // =========================
  refreshAll(): void {
    this.loadSessionOuverte(true).subscribe();
    this.loadHistoriqueDuJour(true).subscribe();
  }

  // =========================
  // RESET
  // =========================
  clear(): void {
    this.sessionSubject.next(null);
    this.historiqueSubject.next([]);
    this.tauxSubject.next(0);

    this.sessionLoaded = false;
    this.historiqueLoaded = false;
  }

// Liste pour le tableau
loadTauxList(force = false): Observable<TauxChangeResponse[]> {
  if (this.tauxLoaded && !force) {
    return of(this.tauxListSubject.value);
  }

  this.loadingTauxSubject.next(true);

  return this.caisseService.getTauxList().pipe(
    tap(list => {
      const safeList = Array.isArray(list) ? list : [];

      this.tauxListSubject.next(safeList);
      this.tauxLoaded = true;

      const actif = safeList.find(t => t.actif) ?? null;
      this.tauxActifSubject.next(actif);
    }),
    finalize(() => this.loadingTauxSubject.next(false))
  );
}


loadTauxActif(): Observable<TauxChangeResponse> {
  this.loadingTauxSubject.next(true);

  return this.caisseService.getTauxActif().pipe(
    tap(taux => {
      this.tauxActifSubject.next(taux);
      this.dernierTauxSubject.next(Number(taux?.taux ?? 0));
    }),
    finalize(() => this.loadingTauxSubject.next(false))
  );
}


// Nombre simple : 2331
loadDernierTaux(): Observable<number> {
  return this.caisseService.getDernierTaux().pipe(
    tap(taux => {
      console.log('dernier taux service', taux);
      this.dernierTauxSubject.next(Number(taux || 0));
    })
  );
}

createTaux(dto: TauxChangeRequest): Observable<TauxChangeResponse> {
  this.loadingTauxSubject.next(true);

  return this.caisseService.createTaux(dto).pipe(
    tap(() => {
      this.loadTauxList(true).subscribe();
      this.loadDernierTaux().subscribe();
    }),
    finalize(() => this.loadingTauxSubject.next(false))
  );
}

updateTaux(id: number, dto: TauxChangeRequest): Observable<TauxChangeResponse> {
  this.loadingTauxSubject.next(true);

  return this.caisseService.updateTaux(id, dto).pipe(
    tap(() => {
      this.loadTauxList(true).subscribe();
      this.loadDernierTaux().subscribe();
    }),
    finalize(() => this.loadingTauxSubject.next(false))
  );
}

activerTaux(id: number): Observable<TauxChangeResponse> {
  this.loadingTauxSubject.next(true);

  return this.caisseService.activerTaux(id).pipe(
    tap(() => {
      this.loadTauxList(true).subscribe();
      this.loadDernierTaux().subscribe();
    }),
    finalize(() => this.loadingTauxSubject.next(false))
  );
}

deleteTaux(id: number): Observable<void> {
  this.loadingTauxSubject.next(true);

  return this.caisseService.deleteTaux(id).pipe(
    tap(() => {
      this.loadTauxList(true).subscribe();
      this.loadDernierTaux().subscribe();
    }),
    finalize(() => this.loadingTauxSubject.next(false))
  );
}
}
