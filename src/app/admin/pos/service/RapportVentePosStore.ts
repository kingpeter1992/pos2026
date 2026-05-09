import { Injectable, inject, signal, computed } from '@angular/core';
import { finalize, Observable, map } from 'rxjs';
import { VenteApiService } from './vente-api-service';
import {
  RapportVentePosResponse,
  RapportVenteDetailResponse,
  RapportVenteKpiResponse,
  RapportVenteFilterRequest
} from '../../produits/models/rapport-vente-pos.model';

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
    map(res => {
      const details = (res.details ?? []).map(x => this.normaliserDetail(x));

      const totalNetCDF = this.round2(details.reduce((s, x) => s + this.toNumber(x.totalNetCDF), 0));
      const totalNetUSD = this.round2(details.reduce((s, x) => s + this.toNumber(x.totalNetUSD), 0));

      const totalPmpCDF = this.round2(details.reduce((s, x) => s + this.toNumber(x.totalPmpCDF), 0));
      const totalPmpUSD = this.round2(details.reduce((s, x) => s + this.toNumber(x.totalPmpUSD), 0));

      const margeCDF = this.round2(details.reduce((s, x) => s + this.toNumber(x.margeCDF), 0));
      const margeUSD = this.round2(details.reduce((s, x) => s + this.toNumber(x.margeUSD), 0));

      const pourcentageMarge =
        totalNetCDF > 0 ? this.round2((margeCDF / totalNetCDF) * 100) : 0;

      const totalGeneral: RapportVenteKpiResponse = {
        cst: 'Total général',

        totalNet: totalNetCDF,
        totalPmp: totalPmpCDF,
        marge: margeCDF,

        totalNetCDF,
        totalNetUSD,

        totalPmpCDF,
        totalPmpUSD,

        margeCDF,
        margeUSD,

        pourcentageMarge
      } as RapportVenteKpiResponse;

      const kpi: RapportVenteKpiResponse = {
        cst: String(details.length),

        totalNet: totalNetCDF,
        totalPmp: totalPmpCDF,
        marge: margeCDF,

        totalNetCDF,
        totalNetUSD,

        totalPmpCDF,
        totalPmpUSD,

        margeCDF,
        margeUSD,

        pourcentageMarge
      } as RapportVenteKpiResponse;

      const normalized: RapportVentePosResponse = {
        ...res,
        details,
        kpis: [kpi],
        totalGeneral
      };

      this.response.set(normalized);

      return normalized;
    }),
    finalize(() => this.loading.set(false))
  );
}

  clear(): void {
    this.response.set(null);
  }

  private toNumber(value: any): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }

    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  private round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private pickNumber(row: any, keys: string[]): number {
    for (const key of keys) {
      if (row[key] !== null && row[key] !== undefined && row[key] !== '') {
        return this.toNumber(row[key]);
      }
    }

    return 0;
  }

  private normaliserDetail(row: any): RapportVenteDetailResponse {
    const quantite = this.pickNumber(row, [
      'quantiteFacturee',
      'quantite',
      'quantite_commandee'
    ]);

    const taux = this.pickNumber(row, [
      'coursDevise',
      'tauxChange',
      'taux_change',
      'taux_change_utilise'
    ]);

    const prixNetCDF = this.pickNumber(row, [
      'prixNetCDF',
      'prixcdf',
      'prix_cdf',
      'prixNet',
      'prix_unitaire',
      'prixUnitaire'
    ]);

    const prixNetUSD = this.pickNumber(row, [
      'prixNetUSD',
      'prixusd',
      'prix_usd'
    ]);

    const totalNetCDF = this.pickNumber(row, [
      'totalNetCDF',
      'totalcdf',
      'total_cdf',
      'totalNet',
      'sous_total'
    ]);

    const totalNetUSD = this.pickNumber(row, [
      'totalNetUSD',
      'totalusd',
      'total_usd'
    ]);

    const pmpCDF = this.pickNumber(row, [
      'pmpCDF',
      'pmpcdf',
      'pmp_cdf',
      'pmp'
    ]);

    const pmpUSD = this.pickNumber(row, [
      'pmpUSD',
      'pmpusd',
      'pmp_usd'
    ]);

    const totalPmpCDF =
      this.pickNumber(row, [
        'totalPmpCDF',
        'total_pmpcdf',
        'total_pmp_cdf'
      ]) || this.round2(pmpCDF * quantite);

    const totalPmpUSD =
      this.pickNumber(row, [
        'totalPmpUSD',
        'total_pmpusd',
        'total_pmp_usd'
      ]) || this.round2(pmpUSD * quantite);

    const margeCDF =
      this.pickNumber(row, [
        'margeCDF',
        'margecdf',
        'marge_cdf'
      ]) || this.round2(totalNetCDF - totalPmpCDF);

    const margeUSD =
      this.pickNumber(row, [
        'margeUSD',
        'margeusd',
        'marge_usd'
      ]) || this.round2(totalNetUSD - totalPmpUSD);

    const pourcentageMarge =
      totalNetCDF > 0 ? this.round2((margeCDF / totalNetCDF) * 100) : 0;

    return {
      ...row,

      quantiteFacturee: quantite,
      coursDevise: taux,

      prixNetCDF,
      prixNetUSD,

      pmpCDF,
      pmpUSD,

      totalNetCDF,
      totalNetUSD,

      totalPmpCDF,
      totalPmpUSD,

      margeCDF,
      margeUSD,

      totalNet: totalNetCDF,
      totalPmp: totalPmpCDF,
      marge: margeCDF,

      pourcentageMarge,

      totalTtcCDF:
        this.pickNumber(row, ['totalTtcCDF', 'totalttccdf', 'total_ttc_cdf']) || totalNetCDF,

      totalTtcUSD:
        this.pickNumber(row, ['totalTtcUSD', 'totalttcusd', 'total_ttc_usd']) || totalNetUSD,

      prixBrutCDF:
        this.pickNumber(row, ['prixBrutCDF', 'prix_brut_cdf', 'prix_brut']) || prixNetCDF,

      prixBrutUSD:
        this.pickNumber(row, ['prixBrutUSD', 'prix_brut_usd']) || prixNetUSD,

      remiseCDF:
        this.pickNumber(row, ['remiseCDF', 'remisecdf', 'remise_cdf']),

      remiseUSD:
        this.pickNumber(row, ['remiseUSD', 'remiseusd', 'remise_usd'])
    } as RapportVenteDetailResponse;
  }
}
