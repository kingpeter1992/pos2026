import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MouvementStockView } from '../../models/mouvementStockView';
import { environment } from '../../../../../environnement/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class MouvementStockService {
  private readonly http = inject(HttpClient);

        private readonly api = `${environment.BASIC_URL}stocks`;

  getAll(): Observable<MouvementStockView[]> {
    return this.http.get<MouvementStockView[]>( `${this.api}/mouvements`);
}
}
