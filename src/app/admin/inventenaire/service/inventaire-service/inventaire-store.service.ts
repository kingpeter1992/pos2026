import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, forkJoin, Observable, tap } from 'rxjs';
import { ServiceInventaire } from './service-inventaire';
import { InventaireResponse, InventaireArticleResponse, InventaireVariance, DashboardInventaireKpi, InventaireCreateRequest } from '../../model/inventaire.models';
import { InventaireResultatResponse } from '../../model/InventaireResultatResponse';


@Injectable({
  providedIn: 'root'
})
export class InventaireStoreService {
  private readonly service = inject(ServiceInventaire);

  private readonly inventairesSubject = signal<InventaireResponse[]>([]);
  private readonly selectedInventaireSubject = signal<InventaireResponse | null>(null);
  private readonly articlesSubject = signal<InventaireArticleResponse[]>([]);
  private readonly variancesSubject = signal<InventaireVariance[]>([]);
  private readonly loadingSubject = signal(false);
  private readonly detailLoadingSubject = signal(false);
  private readonly errorSubject = signal<string | null>(null);

  readonly inventaires = this.inventairesSubject.asReadonly();
  readonly selectedInventaire = this.selectedInventaireSubject.asReadonly();
  readonly articles = this.articlesSubject.asReadonly();
  readonly loading = this.loadingSubject.asReadonly();
  readonly detailLoading = this.detailLoadingSubject.asReadonly();
  readonly error = this.errorSubject.asReadonly();
  private readonly submittingSubject = signal(false);
  readonly submitting = this.submittingSubject.asReadonly();



  private readonly _resultatInventaire = signal<InventaireResultatResponse | null>(null);
  private readonly _loadingResultat = signal(false);
  private readonly _errorResultat = signal<string | null>(null);

  readonly resultatInventaire = computed(() => this._resultatInventaire());
  readonly loadingResultat = computed(() => this._loadingResultat());
  readonly errorResultat = computed(() => this._errorResultat());

  readonly errorVariances = signal<string | null>(null);
  private readonly _variances = signal<InventaireVariance[]>([]);
  readonly variances = this._variances.asReadonly();
  private readonly _loadingVariances = signal(false);
  readonly loadingVariances = this._loadingVariances.asReadonly();




  private readonly _resultats = signal<InventaireResultatResponse[]>([]);
  private readonly _selectedInventaireId = signal<number | null>(null);

  private readonly _dateFrom = signal<string | null>(this.getDefaultDateFrom());
  private readonly _dateTo = signal<string | null>(this.getToday());

  private readonly _loadingResultats = signal(false);

  readonly resultats = computed(() => this._resultats());

  readonly selectedInventaireId = computed(() => this._selectedInventaireId());

  readonly dateFrom = computed(() => this._dateFrom());
  readonly dateTo = computed(() => this._dateTo());

  readonly loadingResultats = computed(() => this._loadingResultats());


readonly kpis = computed<DashboardInventaireKpi>(() => {
    const inventaires = this.inventairesSubject();
    const articles = this.articlesSubject();

    return {
      totalInventaires: inventaires.length,
      brouillons: inventaires.filter(i => i.statut === 'BROUILLON').length,
      ouverts: inventaires.filter(i => i.statut === 'OUVERT').length,
      enComptage: inventaires.filter(i => i.statut === 'EN_COMPTAGE').length,
      varianceLancee: inventaires.filter(i => i.statut === 'VARIANCE_LANCEE').length,
      valides: inventaires.filter(i => i.statut === 'VALIDE').length,
      clotures: inventaires.filter(i => i.statut === 'CLOTURE').length,
      totalArticlesComptes: articles.filter(a => a.compte).length,
      totalValeurEcart: articles.reduce((sum, a) => sum + (Number(a.valeurEcart) || 0), 0)
    };
  });

  readonly progressionComptage = computed(() => {
    const articles = this.articlesSubject();
    if (!articles.length) return 0;
    const comptes = articles.filter(a => a.compte).length;
    return Math.round((comptes / articles.length) * 100);
  });



  loadResultatInventaire(id: number): Observable<InventaireResultatResponse> {
    this._loadingResultat.set(true);
    this._errorResultat.set(null);

    return this.service.getResultatInventaire(id).pipe(
      tap(res => this._resultatInventaire.set(res)),
      finalize(() => this._loadingResultat.set(false))
    );
  }

  clearResultatInventaire(): void {
    this._resultatInventaire.set(null);
    this._errorResultat.set(null);
  }

  loadInventaires(): void {
    this.loadingSubject.set(true);
    this.errorSubject.set(null);

    this.service.getAll()
      .pipe(finalize(() => this.loadingSubject.set(false)))
      .subscribe({
        next: data => {
          this.inventairesSubject.set(data ?? []),
          console.log("Inventaires chargés : ", data);
        },
        error: err => {
          console.error(err);
          this.errorSubject.set("Erreur lors du chargement des inventaires.");
        }
      });
  }

  loadInventaireDetail(inventaireId: number): void {
    this.detailLoadingSubject.set(true);
    this.errorSubject.set(null);

    forkJoin({
      inventaire: this.service.getById(inventaireId),
      articles: this.service.getArticles(inventaireId),
      variances: this.service.getVariances(inventaireId)
    })
      .pipe(finalize(() => this.detailLoadingSubject.set(false)))
      .subscribe({
        next: ({ inventaire, articles, variances }) => {
          this.selectedInventaireSubject.set(inventaire);
          this.articlesSubject.set(articles ?? []);
          this.variancesSubject.set(variances ?? []);
        },
        error: err => {
          console.error(err);
          this.errorSubject.set("Erreur lors du chargement du détail d'inventaire.");
        }
      });
  }

  createInventaire(
    request: InventaireCreateRequest,
    callbacks?: {
      next?: (result: InventaireResponse) => void;
      error?: (message: string) => void;
    }
  ): void {
    this.loadingSubject.set(true);
    this.errorSubject.set(null);

    this.service.create(request)
      .pipe(finalize(() => this.loadingSubject.set(false)))
      .subscribe({
        next: result => {
          this.inventairesSubject.update(list => [result, ...list]);
          callbacks?.next?.(result);
        },
        error: err => {
          console.error(err);
          const message = err?.error?.message || "Erreur lors de la création de l'inventaire.";
          this.errorSubject.set(message);
          callbacks?.error?.(message);
        }
      });
  }

  ouvrirInventaire(id: number): void {
    this.loadingSubject.set(true);

    this.service.ouvrir(id)
      .pipe(finalize(() => this.loadingSubject.set(false)))
      .subscribe({
        next: updated => {
          this.inventairesSubject.update(list =>
            list.map(item => item.id === updated.id ? updated : item)
          );
        },
        error: err => {
          console.error(err);
          this.errorSubject.set("Erreur lors de l'ouverture de l'inventaire.");
        }
      });
  }

  lancerVariances(inventaireId: number): void {
    this.detailLoadingSubject.set(true);

    this.service.lancerVariances(inventaireId)
      .pipe(finalize(() => this.detailLoadingSubject.set(false)))
      .subscribe({
        next: () => this.loadInventaireDetail(inventaireId),
        error: err => {
          console.error(err);
          this.errorSubject.set("Erreur lors du lancement des variances.");
        }
      });
  }

  validerInventaire(inventaireId: number, user: string): void {
    this.detailLoadingSubject.set(true);

    this.service.validerInventaire(inventaireId, user)
      .pipe(finalize(() => this.detailLoadingSubject.set(false)))
      .subscribe({
        next: () => {
          this.loadInventaires();
          this.loadInventaireDetail(inventaireId);
        },
        error: err => {
          console.error(err);
          this.errorSubject.set("Erreur lors de la validation de l'inventaire.");
        }
      });
  }

  cloturerInventaire(inventaireId: number, user: string): void {
    this.detailLoadingSubject.set(true);

    this.service.cloturerInventaire(inventaireId, user)
      .pipe(finalize(() => this.detailLoadingSubject.set(false)))
      .subscribe({
        next: () => {
          this.loadInventaires();
          this.loadInventaireDetail(inventaireId);
        },
        error: err => {
          console.error(err);
          this.errorSubject.set("Erreur lors de la clôture de l'inventaire.");
        }
      });
  }

  clearDetail(): void {
    this.selectedInventaireSubject.set(null);
    this.articlesSubject.set([]);
    this.variancesSubject.set([]);
  }

  annulerInventaire(inventaireId: number, user: string, commentaire?: string): void {
    this.detailLoadingSubject.set(true);

    this.service.annulerInventaire(inventaireId, user, commentaire)
      .pipe(finalize(() => this.detailLoadingSubject.set(false)))
      .subscribe({
        next: () => {
          this.loadInventaires();
          this.loadInventaireDetail(inventaireId);
        },
        error: err => {
          console.error(err);
          this.errorSubject.set("Erreur lors de l'annulation de l'inventaire.");
        }
      });
  }



  loadAllVariances(): void {
    this._loadingVariances.set(true);

    this.service.getAllVariances()
      .pipe(finalize(() => this._loadingVariances.set(false)))
      .subscribe({
        next: (rows) => {
          this._variances.set(rows ?? []);
          console.log("Variances chargées : ", rows);
        },
        error: (err) => {
          console.error('Erreur chargement variances', err);
          this._variances.set([]);
        }
      });
  }




   readonly resultatsFiltres = computed(() => {
    let list = this._resultats();

    const from = this._dateFrom();
    const to = this._dateTo();

    if (from) {
      const fromDate = new Date(from);

      list = list.filter(x =>
        x.inventaire?.dateInventaire &&
        new Date(x.inventaire.dateInventaire) >= fromDate
      );
    }

    if (to) {
      const toDate = new Date(to);

      list = list.filter(x =>
        x.inventaire?.dateInventaire &&
        new Date(x.inventaire.dateInventaire) <= toDate
      );
    }

    return list;
  });

  readonly resultatSelectionne = computed(() => {
    const id = this._selectedInventaireId();
    const list = this.resultatsFiltres();

    if (id) {
      return list.find(x => x.inventaire?.id === id) ?? null;
    }

    return list.length ? list[0] : null;
  });

loadResultatsInventaires(): void {
  this._loadingResultats.set(true);

  this.service.getResultatsInventaires(
    this._dateFrom() ?? undefined,
    this._dateTo() ?? undefined
  )
    .pipe(
      finalize(() => this._loadingResultats.set(false))
    )
    .subscribe({
      next: res => {
        this._resultats.set(res || []);

        const first = this.resultatsFiltres()[0];

        this._selectedInventaireId.set(
          first ? first.inventaire.id : null
        );
      },
      error: () => {
        this._resultats.set([]);
        this._selectedInventaireId.set(null);
      }
    });
}

  selectInventaire(id: number | null): void {
    this._selectedInventaireId.set(id);
  }

  setDateFilter(from: string | null, to: string | null): void {
    this._dateFrom.set(from);
    this._dateTo.set(to);

    const first = this.resultatsFiltres()[0];

    this._selectedInventaireId.set(
      first ? first.inventaire.id : null
    );
  }

  private getToday(): string {
    return new Date().toISOString().split('T')[0];
  }

  private getDefaultDateFrom(): string {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  }
}
