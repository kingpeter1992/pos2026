import { inject, Injectable } from '@angular/core';
import { CaisseSessionDto, CloturerCaisseDTO, OperationCaisseDTO, OuvrirCaisseDTO, TransactionCaisseDto } from '../models/caisse.model';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environnement/environment';
import { TauxChangeResponse, TauxChangeRequest } from '../models/taux-change.model';

@Injectable({
  providedIn: 'root',
})
export class CaisseService {
  private readonly http = inject(HttpClient);

  private readonly caisseUrl = `${environment.BASIC_URL}caisse`;
  private readonly tauxUrl = `${environment.BASIC_URL}caisse/taux`;

  // =========================
  // CAISSE
  // =========================

  getCaisseReport(dateFrom: string, dateTo: string): Observable<any> {
    return this.http.get<any>(`${this.caisseUrl}/report`, {
      params: { dateFrom, dateTo }
    });
  }

  ouvrir(dto: OuvrirCaisseDTO): Observable<CaisseSessionDto> {
    return this.http.post<CaisseSessionDto>(`${this.caisseUrl}/ouvrir`, dto);
  }

  cloturer(dto: CloturerCaisseDTO): Observable<CaisseSessionDto> {
    return this.http.post<CaisseSessionDto>(`${this.caisseUrl}/cloturer`, dto);
  }

  sessionOuverte(): Observable<CaisseSessionDto> {
    return this.http.get<CaisseSessionDto>(`${this.caisseUrl}/session/ouverte`);
  }

  operation(dto: OperationCaisseDTO): Observable<any> {
    return this.http.post(`${this.caisseUrl}/operation`, dto);
  }

  historiqueDuJour(): Observable<TransactionCaisseDto[]> {
    return this.http.get<TransactionCaisseDto[]>(`${this.caisseUrl}/historique/jour`);
  }

  // =========================
  // TAUX DE CHANGE
  // =========================

  getTauxList(): Observable<TauxChangeResponse[]> {
    return this.http.get<TauxChangeResponse[]>(`${this.tauxUrl}`);
  }

  getTauxActif(): Observable<TauxChangeResponse> {
    return this.http.get<TauxChangeResponse>(`${this.tauxUrl}/actif`);
  }

  getDernierTaux(): Observable<number> {
    return this.http.get<number>(`${this.tauxUrl}/last`);
  }

  createTaux(dto: TauxChangeRequest): Observable<TauxChangeResponse> {
    return this.http.post<TauxChangeResponse>(this.tauxUrl, dto);
  }

  updateTaux(id: number, dto: TauxChangeRequest): Observable<TauxChangeResponse> {
    return this.http.put<TauxChangeResponse>(`${this.tauxUrl}/${id}`, dto);
  }

  activerTaux(id: number): Observable<TauxChangeResponse> {
    return this.http.patch<TauxChangeResponse>(`${this.tauxUrl}/${id}/activer`, {});
  }

  deleteTaux(id: number): Observable<void> {
    return this.http.delete<void>(`${this.tauxUrl}/${id}`);
  }
}
