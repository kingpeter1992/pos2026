import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environnement/environment';
import {
  InventaireBordereauLigneResponse,
  InventaireBordereauLigneUpdateRequest,
  InventaireGenererBordereauxRequest} from '../../model/inventaire-bordereau.models';

@Injectable({
  providedIn: 'root',
})
export class InventaireBordereau {
 private readonly http = inject(HttpClient);
  private readonly api = `${environment.BASIC_URL}inventaires`;

  genererBordereaux(
    inventaireId: number,
    request: InventaireGenererBordereauxRequest
  ): Observable<any[]> {
    return this.http.post<any[]>(
      `${this.api}/${inventaireId}/generer-bordereaux`,
      request
    );
  }

  getBordereaux(inventaireId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.api}/${inventaireId}/bordereaux`
    );
  }

  getLignes(bordereauId: number): Observable<InventaireBordereauLigneResponse[]> {
    return this.http.get<InventaireBordereauLigneResponse[]>(
      `${this.api}/bordereaux/${bordereauId}/lignes`
    );
  }

  saveLignes(
    bordereauId: number,
    lignes: InventaireBordereauLigneUpdateRequest[]
  ): Observable<void> {
    return this.http.put<void>(
      `${this.api}/bordereaux/${bordereauId}/lignes`,
      lignes
    );
  }

  validerBordereau(bordereauId: number, user: string): Observable<void> {
    return this.http.post<void>(
      `${this.api}/bordereaux/${bordereauId}/valider`,
      null,
      { params: { user } }
    );
  }

  miseAJourStock(bordereauId: number, user: string): Observable<void> {
    return this.http.post<void>(
      `${this.api}/bordereaux/${bordereauId}/mise-a-jour-stock`,
      null,
      { params: { user } }
    );
  }

lancerVariances(bordereauId: number): Observable<void> {
  return this.http.post<void>(
    `${this.api}/bordereaux/${bordereauId}/lancer-variances`,
    {}
  );
}

cloturerInventaire(inventaireId: number, user: string): Observable<void> {
  return this.http.post<void>(
    `${this.api}/bordereaux/${inventaireId}/cloturer`,
    null,
    { params: { user } }
  );
}




}
