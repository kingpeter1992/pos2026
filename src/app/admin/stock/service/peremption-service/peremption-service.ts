import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AlertePeremption } from '../../models/alerte-peremption.model';
import { DashboardPeremption } from '../../models/dashboard-peremption.model';
import { StockLot } from '../../models/stock-lot.model';
import { environment } from '../../../../../environnement/environment';

@Injectable({
  providedIn: 'root',
})

export class PeremptionService {
  private http = inject(HttpClient);
        private readonly baseUrl = `${environment.BASIC_URL}peremption`;

  getAlertes(): Observable<AlertePeremption[]> {
    return this.http.get<AlertePeremption[]>(`${this.baseUrl}/alertes`);
  }

  getDashboard(): Observable<DashboardPeremption> {
    return this.http.get<DashboardPeremption>(`${this.baseUrl}/dashboard`);
  }

  recalculerStatuts(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/recalculer`, {});
  }

  /**
   * Charge tous les lots une seule fois
   */
  getLots(): Observable<StockLot[]> {
    return this.http.get<StockLot[]>(this.baseUrl +'/lot');
  }

  getLotById(id: number): Observable<StockLot> {
    return this.http.get<StockLot>(`${this.baseUrl}/byid/${id}`);
  }

  /**
   * Filtre local sur la liste déjà chargée
   */
  filtrerLots(
    lots: StockLot[],
    filters?: {
      depotId?: number | null;
      produit?: string | null;
      statut?: string | null;
      uniquementDisponibles?: boolean | null;
      recherche?: string | null;
    }
  ): StockLot[] {
    if (!lots?.length) return [];

    const produit = (filters?.produit || '').trim().toLowerCase();
    const statut = (filters?.statut || '').trim().toLowerCase();
    const recherche = (filters?.recherche || '').trim().toLowerCase();
    const depotId = filters?.depotId ?? null;
    const uniquementDisponibles = filters?.uniquementDisponibles ?? null;

    return lots.filter((lot) => {
      const matchDepot = depotId == null || lot.depotId === depotId;

      const matchProduit =
        !produit ||
        (lot.produitNom || '').toLowerCase().includes(produit) ||
        (lot.codeBarres || '').toLowerCase().includes(produit);

      const matchStatut =
        !statut ||
        (lot.statutPeremption || '').toLowerCase() === statut;

      const matchDisponibilite =
        uniquementDisponibles == null ||
        !uniquementDisponibles ||
        Number(lot.quantiteDisponible || 0) > 0;

      const matchRecherche =
        !recherche ||
        (lot.produitNom || '').toLowerCase().includes(recherche) ||
        (lot.depotNom || '').toLowerCase().includes(recherche) ||
        (lot.codeBarres || '').toLowerCase().includes(recherche) ||
        (lot.referenceDocument || '').toLowerCase().includes(recherche) ||
        (lot.sourceDocument || '').toLowerCase().includes(recherche) ||
        (lot.statutPeremption || '').toLowerCase().includes(recherche);

      return (
        matchDepot &&
        matchProduit &&
        matchStatut &&
        matchDisponibilite &&
        matchRecherche
      );
    });
  }

  /**
   * Filtre local des alertes
   */
  filtrerAlertes(
    alertes: AlertePeremption[],
    filters?: {
      depotNom?: string | null;
      produit?: string | null;
      statut?: string | null;
      niveauAlerte?: string | null;
      recherche?: string | null;
    }
  ): AlertePeremption[] {
    if (!alertes?.length) return [];

    const depotNom = (filters?.depotNom || '').trim().toLowerCase();
    const produit = (filters?.produit || '').trim().toLowerCase();
    const statut = (filters?.statut || '').trim().toLowerCase();
    const niveau = (filters?.niveauAlerte || '').trim().toLowerCase();
    const recherche = (filters?.recherche || '').trim().toLowerCase();

    return alertes.filter((item) => {
      const matchDepot =
        !depotNom || (item.depotNom || '').toLowerCase().includes(depotNom);

      const matchProduit =
        !produit || (item.produitNom || '').toLowerCase().includes(produit);

      const matchStatut =
        !statut || (item.statutPeremption || '').toLowerCase() === statut;

      const matchNiveau =
        !niveau || (item.niveauAlerte || '').toLowerCase().includes(niveau);

      const matchRecherche =
        !recherche ||
        (item.produitNom || '').toLowerCase().includes(recherche) ||
        (item.depotNom || '').toLowerCase().includes(recherche) ||
        (item.statutPeremption || '').toLowerCase().includes(recherche) ||
        (item.niveauAlerte || '').toLowerCase().includes(recherche);

      return matchDepot && matchProduit && matchStatut && matchNiveau && matchRecherche;
    });
  }

  /**
   * Tri local
   */
  trierLots(
    lots: StockLot[],
    champ: 'produitNom' | 'depotNom' | 'datePeremption' | 'quantiteDisponible' | 'coutUnitaireFinal' | 'joursRestants',
    direction: 'asc' | 'desc' = 'asc'
  ): StockLot[] {
    const data = [...(lots || [])];

    data.sort((a, b) => {
      let valA: any = a?.[champ as keyof StockLot];
      let valB: any = b?.[champ as keyof StockLot];

      if (champ === 'datePeremption') {
        valA = valA ? new Date(valA).getTime() : Number.MAX_SAFE_INTEGER;
        valB = valB ? new Date(valB).getTime() : Number.MAX_SAFE_INTEGER;
      }

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  }

  /**
   * Renvoie uniquement les lots en alerte depuis la liste globale
   */
  extraireLotsEnAlerte(lots: StockLot[]): StockLot[] {
    return (lots || []).filter(lot =>
      lot.statutPeremption &&
      lot.statutPeremption !== 'VALIDE'
    );
  }

  /**
   * Renvoie uniquement les lots périmés
   */
  extraireLotsPerimes(lots: StockLot[]): StockLot[] {
    return (lots || []).filter(lot => lot.statutPeremption === 'PERIME');
  }
}
