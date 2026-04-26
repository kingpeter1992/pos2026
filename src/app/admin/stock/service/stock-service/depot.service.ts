import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environnement/environment.prod';

export interface DepotDto {
  id: number;
  nom: string;
  code?: string;
  adresse?: string;
  actif?: boolean;
  parDefaut?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DepotService {
  private readonly http = inject(HttpClient);

      private readonly baseUrl = `${environment.BASIC_URL}stocks`;
  // si tu utilises environment :
  // private readonly baseUrl = `${environment.apiUrl}/depots`;

  getAll(): Observable<DepotDto[]> {
    return this.http.get<DepotDto[]>(this.baseUrl+'/depos');
  }

  getActifs(): Observable<DepotDto[]> {
    return this.http.get<DepotDto[]>(`${this.baseUrl}/deposactifs`);
  }

  getById(id: number): Observable<DepotDto> {
    return this.http.get<DepotDto>(`${this.baseUrl}depos/${id}`);
  }
}
