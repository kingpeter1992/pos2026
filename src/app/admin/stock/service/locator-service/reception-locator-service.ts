import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReceptionLocatorPreparationResponse, ReceptionLocatorRequest } from '../../models/reception-locator.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environnement/environment';

@Injectable({
  providedIn: 'root',
})
export class ReceptionLocatorService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.BASIC_URL}receptions-locators`;


  getPreparation(receptionId: number): Observable<ReceptionLocatorPreparationResponse> {
    return this.http.get<ReceptionLocatorPreparationResponse>(`${this.api}/${receptionId}`);
  }

  save(receptionId: number, payload: ReceptionLocatorRequest): Observable<void> {
    return this.http.post<void>(`${this.api}/${receptionId}`, payload);
  }

}
