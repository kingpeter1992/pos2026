import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environnement/environment';
import { InventaireCreateRequest, InventaireResponse, InventaireArticleResponse, InventaireVariance } from '../../model/inventaire.models';
import { InventaireVarianceResumeResponse } from '../variance/inventaire-variance-service';

@Injectable({
  providedIn: 'root',
})
export class ServiceInventaire {

private readonly http = inject(HttpClient);
  private readonly api = `${environment.BASIC_URL}inventaires`;

  create(request: InventaireCreateRequest): Observable<InventaireResponse> {
    return this.http.post<InventaireResponse>(this.api, request);
  }

  getAll(): Observable<InventaireResponse[]> {
    return this.http.get<InventaireResponse[]>(this.api);
  }

  getById(id: number): Observable<InventaireResponse> {
    return this.http.get<InventaireResponse>(`${this.api}/${id}`);
  }

  ouvrir(id: number): Observable<InventaireResponse> {
    return this.http.post<InventaireResponse>(`${this.api}/${id}/ouvrir`, {});
  }

  getArticles(inventaireId: number): Observable<InventaireArticleResponse[]> {
    return this.http.get<InventaireArticleResponse[]>(`${this.api}/${inventaireId}/articles`);
  }

  lancerVariances(inventaireId: number): Observable<void> {
    return this.http.post<void>(`${this.api}/${inventaireId}/lancer-variances`, {});
  }

  getVariances(inventaireId: number): Observable<InventaireVariance[]> {
    return this.http.get<InventaireVariance[]>(`${this.api}/${inventaireId}/variances`);
  }

  validerInventaire(inventaireId: number, user: string): Observable<void> {
    return this.http.post<void>(`${this.api}/${inventaireId}/valider`, null, {
      params: { user }
    });
  }

  cloturerInventaire(inventaireId: number, user: string): Observable<void> {
    return this.http.post<void>(`${this.api}/${inventaireId}/cloturer`, null, {
      params: { user }
    });
  }

annulerInventaire(inventaireId: number, user: string, commentaire?: string) {
  return this.http.post<void>(`${this.api}/${inventaireId}/annuler`, null, {
    params: {
      user,
      commentaire: commentaire || ''
    }
  });
}


  getAllVariances(): Observable<InventaireVariance[]> {
    return this.http.get<InventaireVariance[]>(`${this.api}/variances`);
  }

getResumeVariances(inventaireId: number): Observable<InventaireVarianceResumeResponse> {
  return this.http.get<InventaireVarianceResumeResponse>(
    `${this.api}/${inventaireId}/variances/resume`
  );
}
}
