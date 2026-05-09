import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, tap } from 'rxjs';
import { RequisitionService } from './requisition-service';
import { RequisitionResponse, RequisitionHistorique, RequisitionKpi, RequisitionCreateRequest } from '../../models/requisition.model';


@Injectable({
  providedIn: 'root'
})
export class RequisitionStoreService {

  private readonly service = inject(RequisitionService);

  private readonly _items = signal<RequisitionResponse[]>([]);
  private readonly _historique = signal<RequisitionHistorique[]>([]);

  private readonly _loading = signal(false);
  private readonly _loadingHistorique = signal(false);
  private readonly _saving = signal(false);

  private readonly _error = signal<string | null>(null);

  readonly items = this._items.asReadonly();
  readonly historique = this._historique.asReadonly();

  readonly loading = this._loading.asReadonly();
  readonly loadingHistorique = this._loadingHistorique.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly error = this._error.asReadonly();

  readonly totalDemandes = computed(() =>
    this._items().reduce((acc, x) => acc + this.num(x.totalDemandes), 0)
  );

  readonly totalVentes = computed(() =>
    this._items().reduce((acc, x) => acc + this.num(x.totalVentes), 0)
  );

  readonly totalVentesManquees = computed(() =>
    this._items().reduce((acc, x) => acc + this.num(x.totalVentesManquees), 0)
  );

  readonly totalQuantiteVendue = computed(() =>
    this._items().reduce((acc, x) => acc + this.num(x.totalQuantiteVendue), 0)
  );

  readonly totalQuantiteDemandeeNonVendue = computed(() =>
    this._items().reduce((acc, x) => acc + this.num(x.totalQuantiteDemandeeNonVendue), 0)
  );

  readonly tauxSatisfaction = computed(() => {
    const demandes = this.totalDemandes();
    if (demandes <= 0) return 0;
    return this.round((this.totalVentes() / demandes) * 100);
  });

  readonly tauxManque = computed(() => {
    const demandes = this.totalDemandes();
    if (demandes <= 0) return 0;
    return this.round((this.totalVentesManquees() / demandes) * 100);
  });

  readonly kpi = computed<RequisitionKpi>(() => ({
    totalDemandes: this.totalDemandes(),
    totalVentes: this.totalVentes(),
    totalVentesManquees: this.totalVentesManquees(),
    totalQuantiteVendue: this.totalQuantiteVendue(),
    totalQuantiteDemandeeNonVendue: this.totalQuantiteDemandeeNonVendue(),
    tauxSatisfaction: this.tauxSatisfaction(),
    tauxManque: this.tauxManque()
  }));

  readonly topDemandes = computed(() =>
    [...this._items()]
      .sort((a, b) => this.num(b.totalDemandes) - this.num(a.totalDemandes))
      .slice(0, 10)
  );

  readonly topManques = computed(() =>
    [...this._items()]
      .sort((a, b) => this.num(b.totalVentesManquees) - this.num(a.totalVentesManquees))
      .slice(0, 10)
  );

  readonly produitsCritiques = computed(() =>
    this._items()
      .filter(x => this.num(x.totalVentesManquees) > 0)
      .sort((a, b) => this.num(b.tauxManque) - this.num(a.tauxManque))
  );

  loadAll(): void {
    this._loading.set(true);
    this._error.set(null);

    this.service.getAll()
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: res => this._items.set(res || []),
        error: err => {
          this._items.set([]);
          this._error.set(err?.error?.message || 'Erreur chargement réquisitions');
        }
      });
  }

  loadHistorique(dateFrom: string, dateTo: string): void {
    this._loadingHistorique.set(true);
    this._error.set(null);

    this.service.getHistorique(dateFrom, dateTo)
      .pipe(finalize(() => this._loadingHistorique.set(false)))
      .subscribe({
        next: res => this._historique.set(res || []),
        error: err => {
          this._historique.set([]);
          this._error.set(err?.error?.message || 'Erreur chargement historique réquisition');
        }
      });
  }

  enregistrerDemande(payload: RequisitionCreateRequest): void {
    this._saving.set(true);
    this._error.set(null);

    console.log("prod requi", payload)

    this.service.enregistrerDemande(payload)
      .pipe(finalize(() => this._saving.set(false)))
      .subscribe({
        next: () => this.loadAll(),
        error: err => {
          this._error.set(err?.error?.message || 'Erreur enregistrement réquisition');
        }
      });
  }

  enregistrerVenteManquee(
    produitId: number,
    depotId: number | null,
    locatorId: number | null,
    quantite: number,
    creePar: string,
    commentaire?: string
  ): void {
    this.enregistrerDemande({
      produitId,
      depotId,
      locatorId,
      quantite,
      type: 'VENTE_MANQUEE',
      produitExistant: true,
      origine: 'PRODUIT_EXISTANT_STOCK_INSUFFISANT',
      commentaire,
      creePar
    });
  }

  enregistrerNouveauProduitDemande(
    produitId: number,
    depotId: number | null,
    locatorId: number | null,
    quantite: number,
    creePar: string,
    commentaire?: string
  ): void {
    this.enregistrerDemande({
      produitId,
      depotId,
      locatorId,
      quantite,
      type: 'NOUVEAU_PRODUIT_DEMANDE',
      produitExistant: false,
      origine: 'NOUVEAU_PRODUIT_ENREGISTRE',
      commentaire,
      creePar
    });
  }

  enregistrerVenteReelle(
    produitId: number,
    depotId: number | null,
    locatorId: number | null,
    quantite: number,
    creePar: string
  ): void {
    this.enregistrerDemande({
      produitId,
      depotId,
      locatorId,
      quantite,
      type: 'VENTE_REALISEE',
      produitExistant: true,
      origine: 'VENTE_POS',
      creePar
    });
  }

  clearError(): void {
    this._error.set(null);
  }

  private num(value: any): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
