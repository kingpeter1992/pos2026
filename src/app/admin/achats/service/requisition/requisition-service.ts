import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RequisitionCreateRequest, RequisitionResponse, RequisitionHistorique } from '../../models/requisition.model';
import { environment } from '../../../../../environnement/environment';

@Injectable({
  providedIn: 'root',
})
export class RequisitionService {

  private readonly http = inject(HttpClient);

 // private readonly apiUrl = 'http://localhost:8080/api/requisitions';
  // Si tu as environment :
      private readonly apiUrl = `${environment.BASIC_URL}requisitions`;

  enregistrerDemande(payload: RequisitionCreateRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/demande`, payload);
  }

  getAll(): Observable<RequisitionResponse[]> {
    return this.http.get<RequisitionResponse[]>(this.apiUrl);
  }

  getHistorique(dateFrom: string, dateTo: string): Observable<RequisitionHistorique[]> {
    const params = new HttpParams()
      .set('dateFrom', dateFrom)
      .set('dateTo', dateTo);

    return this.http.get<RequisitionHistorique[]>(
      `${this.apiUrl}/historique`,
      { params }
    );
  }


}
