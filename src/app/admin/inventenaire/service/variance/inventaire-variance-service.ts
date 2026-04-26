import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environnement/environment';

export interface InventaireVarianceLigneResponse {
  id: number;
  produitId: number | null;
  produitNom: string | null;
  codeBarres: string | null;
  categorieNom: string | null;
  depotNom: string | null;
  locatorCode: string | null;
  stockTheorique: number;
  stockPhysiqueRetenu: number;
  ecart: number;
  pmp: number;
  valeurEcart: number;
  type: 'ENTREE' | 'SORTIE' | 'NEANT';
}

export interface InventaireVarianceResumeResponse {
  inventaireId: number;
  referenceInventaire: string | null;
  depotNom: string | null;
  locatorCode: string | null;
  statut: string | null;
  varianceLancee: boolean | null;

  totalLignes: number;
  totalEntrees: number;
  totalSorties: number;
  totalNeant: number;

  totalEcartPositif: number;
  totalEcartNegatif: number;
  totalValeurPositive: number;
  totalValeurNegative: number;
  totalValeurNette: number;

  lignes: InventaireVarianceLigneResponse[];
}

@Injectable({
  providedIn: 'root',
})
export class InventaireVarianceService {

  private readonly http = inject(HttpClient);
  private readonly api = `${environment.BASIC_URL}inventaires`;

  getResumeVariances(inventaireId: number): Observable<InventaireVarianceResumeResponse> {
    return this.http.get<InventaireVarianceResumeResponse>(
      `${this.api}/${inventaireId}/variances/resume`
    );
  }

  imprimerResumeVariancesPdf(inventaireId: number): Observable<Blob> {
    return this.http.get(
      `${this.api}/${inventaireId}/variances/pdf`,
      { responseType: 'blob' }
    );
  }

  lancerVariances(inventaireId: number): Observable<void> {
    return this.http.post<void>(
      `${this.api}/${inventaireId}/variances/lancer`,
      {}
    );
  }

}
