import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StockProduitView } from '../../models/stock-produit.model';
import { environment } from '../../../../../environnement/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class StockProduitService {
   private http = inject(HttpClient);
      private readonly api = `${environment.BASIC_URL}stocks`;

  getAll(): Observable<StockProduitView[]> {
    return this.http.get<StockProduitView[]>(this.api);
  }
}
