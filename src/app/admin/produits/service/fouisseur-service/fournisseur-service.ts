import { Injectable } from '@angular/core';
import { environment } from '../../../../../environnement/environment.prod';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';
import { FournisseurRequest, FournisseurResponse } from '../../models/fournisseur.model';

@Injectable({
  providedIn: 'root',
})
export class FournisseurService {

      private readonly apiUrl = `${environment.BASIC_URL}fournisseurs`;

       constructor(private http: HttpClient) {}

getAll(keyword?: string): Observable<FournisseurResponse[]> {
    let params = new HttpParams();
    if (keyword && keyword.trim()) {
      params = params.set('keyword', keyword);
    }
    return this.http.get<FournisseurResponse[]>(this.apiUrl, { params });
  }

  getById(id: number): Observable<FournisseurResponse> {
    return this.http.get<FournisseurResponse>(`${this.apiUrl}/${id}`);
  }

  create(data: FournisseurRequest ): Observable<FournisseurResponse> {
    return this.http.post<FournisseurResponse>(this.apiUrl, data);
  }

  update(id: number, data: FournisseurRequest ): Observable<FournisseurResponse > {
    return this.http.put<FournisseurResponse >(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

}
