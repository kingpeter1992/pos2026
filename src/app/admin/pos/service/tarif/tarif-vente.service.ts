import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environnement/environment.prod';
import { TarifVente } from '../../../../models/tarif-vente.model';
import { TarificationLotRequest, TarificationResponse, TarifVenteResponse } from '../../../../models/pos.models';
import { TarifCategorieProduitRequest, TarifCategorieProduitResponse, TarificationProduitRequest } from '../../../produits/models/vente.model';

@Injectable({
  providedIn: 'root',
})
export class TarifVenteService {



 calculerPrixEnLot(payload: TarificationLotRequest): Observable<TarificationResponse[]> {
    return this.http.post<TarificationResponse[]>(`${this.apiUrl}/calcul-lot`, payload);
  }

  private readonly apiUrl = `${environment.BASIC_URL}tarifs-vente`;
  constructor(private http: HttpClient) {}

  getAll(): Observable<TarifVente[]> {
    return this.http.get<TarifVente[]>(this.apiUrl);
  }

  getActifs(): Observable<TarifVenteResponse[]> {
    return this.http.get<TarifVenteResponse[]>(`${this.apiUrl}/actifs`);
  }

  getById(id: number): Observable<TarifVente> {
    return this.http.get<TarifVente>(`${this.apiUrl}/${id}`);
  }

  create(payload: any): Observable<TarifVente> {
    console.log('Payload envoyé pour création back end ', payload);
    return this.http.post<TarifVente>(this.apiUrl, payload);
  }






  update(id: number, payload: any): Observable<TarifVente> {
    return this.http.put<TarifVente>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  toggleActif(id: number): Observable<TarifVente> {
    return this.http.put<TarifVente>(`${this.apiUrl}/toggle-actif/${id}`, {});
  }

  setParDefaut(id: number): Observable<TarifVente> {
    return this.http.put<TarifVente>(`${this.apiUrl}/defaut/${id}`, {});
  }




  createOrUpdateRegle(payload: TarifCategorieProduitRequest): Observable<TarifCategorieProduitResponse> {
    console.log('Payload envoyé pour création ou mise à jour de règle back end ', payload);
    return this.http.post<TarifCategorieProduitResponse>(`${this.apiUrl}/regles`, payload);
  }

  getAllRegles(): Observable<TarifCategorieProduitResponse[]> {
    return this.http.get<TarifCategorieProduitResponse[]>(`${this.apiUrl}/regles`);
  }

  getReglesByTarif(tarifVenteId: number): Observable<TarifCategorieProduitResponse[]> {
    return this.http.get<TarifCategorieProduitResponse[]>(`${this.apiUrl}/${tarifVenteId}/regles`);
  }

  calculerPrix(payload: any): Observable<TarificationResponse> {
    return this.http.post<TarificationResponse>(`${this.apiUrl}/calcul`, payload);
  }

  calculerPrixLot(payload: any): Observable<TarificationResponse[]> {
    return this.http.post<TarificationResponse[]>(`${this.apiUrl}/calcul-lot`, payload);
  }
}
