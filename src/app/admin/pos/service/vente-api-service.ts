import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { VenteRequest, VenteResponse } from '../../produits/models/vente.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environnement/environment.prod';
import { RapportVenteFilterRequest, RapportVentePosResponse } from '../../produits/models/rapport-vente-pos.model';

@Injectable({
  providedIn: 'root',
})
export class VenteApiService {
   private readonly http = inject(HttpClient);
      private readonly apiUrl = `${environment.BASIC_URL}ventes`;

   save(payload: VenteRequest): Observable<VenteResponse> {
    console.log('Payload de vente envoyé au backend :', payload);
    return this.http.post<VenteResponse>(this.apiUrl, payload);
  }

    getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

annulerVente(id: number, commentaire: string): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/${id}/annuler`, {
    commentaire
  });
}

  getRapportVentes(filter: RapportVenteFilterRequest): Observable<RapportVentePosResponse> {
    return this.http.post<RapportVentePosResponse>(
      `${this.apiUrl}/rapports`,
      filter
    );
  }
}
