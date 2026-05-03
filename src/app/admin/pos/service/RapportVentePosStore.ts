import { Injectable, inject, signal, computed } from '@angular/core';
import { finalize, Observable, tap } from 'rxjs';
import { VenteApiService } from './vente-api-service';
import { RapportVentePosResponse, RapportVenteDetailResponse, RapportVenteKpiResponse, RapportVenteFilterRequest } from '../../produits/models/rapport-vente-pos.model';


@Injectable({ providedIn: 'root' })
export class RapportVentePosStore {
  private readonly service = inject(VenteApiService);

  readonly loading = signal(false);
  readonly response = signal<RapportVentePosResponse | null>(null);

  readonly details = computed<RapportVenteDetailResponse[]>(() =>
    this.response()?.details ?? []
  );

  readonly kpis = computed<RapportVenteKpiResponse[]>(() =>
    this.response()?.kpis ?? []
  );

  readonly totalGeneral = computed<RapportVenteKpiResponse | null>(() =>
    this.response()?.totalGeneral ?? null
  );

  load(filter: RapportVenteFilterRequest): Observable<RapportVentePosResponse> {
    this.loading.set(true);

    return this.service.getRapportVentes(filter).pipe(
      tap(res => this.response.set(res)),
      finalize(() => this.loading.set(false))
    );
  }

  clear(): void {
    this.response.set(null);
  }
}
