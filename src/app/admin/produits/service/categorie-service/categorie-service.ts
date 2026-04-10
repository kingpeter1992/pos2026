import { Injectable } from '@angular/core';
import { BehaviorSubject, finalize, Observable, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../../../../environnement/environment';
import { HttpClient } from '@angular/common/http';
import { CategorieRequest, CategorieResponse } from '../../models/categorie.model';

@Injectable({
  providedIn: 'root',
})


export class CategorieService  {

    private readonly api = `${environment.BASIC_URL}categories`;


  constructor(private http: HttpClient) {}

  create(request: CategorieRequest): Observable<CategorieResponse> {
    return this.http.post<CategorieResponse>(this.api, request);
  }

  findAll(): Observable<CategorieResponse[]> {
    return this.http.get<CategorieResponse[]>(this.api);
  }

  findAllActives(): Observable<CategorieResponse[]> {
    return this.http.get<CategorieResponse[]>(`${this.api}/actives`);
  }

  findById(id: number): Observable<CategorieResponse> {
    return this.http.get<CategorieResponse>(`${this.api}/${id}`);
  }

  update(id: number, request: CategorieRequest): Observable<CategorieResponse> {
    return this.http.put<CategorieResponse>(`${this.api}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
