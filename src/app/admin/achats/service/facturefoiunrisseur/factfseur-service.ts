import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environnement/environment';
import { FactureFournisseurRequest, FactureFournisseurResponse } from '../../models/facture-fournisseur.model';

@Injectable({
  providedIn: 'root',
})
export class FactfseurService {
private readonly apiUrl = `${environment.BASIC_URL}achats/receptions`;

constructor(private http: HttpClient) {}

  creer(request: FactureFournisseurRequest): Observable<FactureFournisseurResponse> {
    return this.http.post<FactureFournisseurResponse>(this.apiUrl, request);
  }

  findAll(): Observable<FactureFournisseurResponse[]> {
    return this.http.get<FactureFournisseurResponse[]>(this.apiUrl);
  }

  payer(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/payer`, {});
  }

  getById(id: number) {
    return this.http.get<FactureFournisseurResponse>(`${this.apiUrl}/${id}`);
  }
}
