import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environnement/environment';
import { ReceptionAchatRequest, ReceptionAchatResponse } from '../../models/reception-achat.model';

@Injectable({
  providedIn: 'root',
})
export class ReceptionAchat {
  getById(id: number) {
    return this.http.get<ReceptionAchatResponse>(`${this.apiUrl}/${id}`);
  }
  getAll() {
    return this.http.get<ReceptionAchatResponse[]>(this.apiUrl);
  }
      private readonly apiUrl = `${environment.BASIC_URL}achats/receptions`;

  constructor(private http: HttpClient) {}

  creer(request: ReceptionAchatRequest): Observable<ReceptionAchatResponse> {
    return this.http.post<ReceptionAchatResponse>(this.apiUrl, request);
  }

  findByCommande(commandeId: number): Observable<ReceptionAchatResponse[]> {
    return this.http.get<ReceptionAchatResponse[]>(`${this.apiUrl}/commande/${commandeId}`);
  }

}
