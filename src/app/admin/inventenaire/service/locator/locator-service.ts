import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../../environnement/environment';
import { Observable } from 'rxjs';

export interface LocatorResponse {
  id: number;
  code: string;
  libelle?: string;
  depotId?: number;
}

@Injectable({
  providedIn: 'root',
})
export class LocatorService {

   private readonly http = inject(HttpClient);
  private readonly api = `${environment.BASIC_URL}depots`;

  findByDepot(depotId: number): Observable<LocatorResponse[]> {
    return this.http.get<LocatorResponse[]>(`${this.api}/locatorbydepot/${depotId}`);
  }

  getAll(): Observable<LocatorResponse[]> {
    return this.http.get<LocatorResponse[]>(`${this.api}/locator`);
  }

}
