import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environnement/environment';
import { CommandeAchatRequest, CommandeAchatResponse } from '../../models/commande-achat.model';

@Injectable({
  providedIn: 'root',
})
export class CommandeAchat {

      private readonly apiUrl = `${environment.BASIC_URL}achats/commandes`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/dashboard`);
}
  creer(request: CommandeAchatRequest): Observable<CommandeAchatResponse> {
    return this.http.post<CommandeAchatResponse>(this.apiUrl, request);
  }

   update(id: number, payload: CommandeAchatRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, payload);
  }

  findAll(): Observable<CommandeAchatResponse[]> {
    return this.http.get<CommandeAchatResponse[]>(this.apiUrl);
  }

  findById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  valider(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/valider`, {});
  }

  annuler(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/annuler`, {});
  }

}
