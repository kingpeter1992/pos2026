import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SuggestionAppro } from '../../models/suggestion-appro.model';
import { environment } from '../../../../../environnement/environment';

@Injectable({
  providedIn: 'root',
})
export class ApprovisionnementService {
  private readonly http = inject(HttpClient);
      private readonly apiUrl = `${environment.BASIC_URL}approvisionnement`;


  getSuggestions(joursCouverture?: number): Observable<SuggestionAppro[]> {
    let params = new HttpParams();

    if (joursCouverture && joursCouverture > 0) {
      params = params.set('joursCouverture', joursCouverture);
    }

    return this.http.get<SuggestionAppro[]>(`${this.apiUrl}/suggestions`, { params });
  }
}
