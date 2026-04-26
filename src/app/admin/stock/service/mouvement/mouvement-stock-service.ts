import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environnement/environment.prod';
import { TransactionStockView } from '../../models/TransactionStockView';

@Injectable({
  providedIn: 'root',
})
export class MouvementStockService {
  private readonly http = inject(HttpClient);

        private readonly api = `${environment.BASIC_URL}stocks`;

  getAll(): Observable<TransactionStockView[]> {
    return this.http.get<TransactionStockView[]>( `${this.api}/mouvements`);
}
}
