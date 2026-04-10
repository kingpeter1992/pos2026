import { Injectable } from '@angular/core';
import { environment } from '../../../../../environnement/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ProduitRequest, ProduitResponse } from '../../models/produit.model';
import { ProduitPos } from '../../models/vente.model';


@Injectable({
  providedIn: 'root',
})
export class ProduitService {

      private readonly api = `${environment.BASIC_URL}produits`;
      private readonly apiPos = `${environment.BASIC_URL}ventes/pos`;




  constructor(private http: HttpClient) {}

  create(request: ProduitRequest): Observable<ProduitResponse> {
    return this.http.post<ProduitResponse>(`${this.api}`, request);
  }

  findAll(): Observable<ProduitResponse[]> {
    return this.http.get<ProduitResponse[]>(`${this.api}`);
  }

  findById(id: number): Observable<ProduitResponse> {
    return this.http.get<ProduitResponse>(`${this.api}/${id}`);
  }

  findByCodeBarres(codeBarres: string): Observable<ProduitResponse> {
    return this.http.get<ProduitResponse>(`${this.api}/barcode/${encodeURIComponent(codeBarres)}`);
  }


  update(id: number, request: ProduitRequest): Observable<ProduitResponse> {
    return this.http.put<ProduitResponse>(`${this.api}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  search(term: string): Observable<ProduitResponse[]> {
    const params = new HttpParams().set('term', term);
    return this.http.get<ProduitResponse[]>(`${this.api}/search`, { params });
  }

  getQrCodeUrl(id: number): string {
    return `${this.api}/${id}/qrcode`;
  }

  getBarcodeUrl(id: number): string {
    return `${this.api}/${id}/barcode-image`;
  }

  getBarcodeImageUrl(id: number): string {
    return `${this.api}/${id}/barcode-image`;
  }

  getProduitsPos(): Observable<ProduitPos[]> {
    return this.http.get<ProduitPos[]>(`${this.apiPos}`);
  }

  findByBarcode(codeBarres: string): Observable<ProduitPos> {
    return this.http.get<ProduitPos>(`${this.api}/barcode/${codeBarres}`);
  }
}
