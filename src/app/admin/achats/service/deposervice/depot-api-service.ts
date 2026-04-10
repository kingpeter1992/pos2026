import { Injectable } from '@angular/core';
import { environment } from '../../../../../environnement/environment';
import { DepotResponse } from '../../models/reception-achat.model';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class DepotApiService {

  private readonly apiUrl = `${environment.BASIC_URL}achats/receptions`;
  constructor(private http: HttpClient) { }

  getAll(): Observable<DepotResponse[]> {
    return this.http.get<DepotResponse[]>(`${this.apiUrl}/depots`);
  }

  getById(id: number): Observable<DepotResponse> {
    return this.http.get<DepotResponse>(`${this.apiUrl}/depots/${id}`);
  }


}
