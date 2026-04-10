import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { VenteRequest } from '../../produits/models/vente.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environnement/environment.prod';
export interface VentePayload {
  ticketNumero: string;
  clientNom?: string;
  caissier?: string;
  modePaiement: string;
  montantRecu: number;
  monnaie: number;
  sousTotal: number;
  totalRemise: number;
  totalGeneral: number;
  tarifId?: number | null;
  lignes: VenteLignePayload[];
}

export interface VenteLignePayload {
  produitId: number;
  quantite: number;
  prix: number;
  remise: number;
  total: number;
}

export interface VenteResponse {
  id: number;
  ticketNumero: string;
  dateVente: string;
  clientNom: string;
  caissier: string;
  modePaiement: string;
  montantRecu: number;
  monnaie: number;
  sousTotal: number;
  totalRemise: number;
  totalGeneral: number;
  devise: string;
  tarifId?: number | null;
  lignes: VenteLigneResponse[];
}

export interface VenteLigneResponse {
  produitId: number | null;
  produitNom: string;
  quantite: number;
  prixUnitaire: number;
  remise: number;
  totalLigne: number;
}
@Injectable({
  providedIn: 'root',
})
export class VenteApiService {
   private readonly http = inject(HttpClient);
      private readonly apiUrl = `${environment.BASIC_URL}ventes`;

   save(payload: VentePayload): Observable<VenteResponse> {
    return this.http.post<VenteResponse>(this.apiUrl, payload);
  }

    getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}
