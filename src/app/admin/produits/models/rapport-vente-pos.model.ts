export interface RapportVenteKpiResponse {
  cst: string;

  totalNet: number;
  totalPmp: number;
  marge: number;

  totalNetCDF: number;
  totalNetUSD: number;

  totalPmpCDF: number;
  totalPmpUSD: number;

  margeCDF: number;
  margeUSD: number;

  pourcentageMarge: number;
}

export interface RapportVenteDetailResponse {
  succursale: string;
  serviceCredite: string;
  module: string;
  natureOperation: string;

  numeroCC: string;
  dateCC: string;

  typeCommandeOuOR: string;
  libelleType: string;

  numeroClient: string;
  nomClient: string;
  codeRemise: string;
  tarif: string;
  operateur: string;

  quantiteCommandee: number;
  quantiteFacturee: number;

  userQuiALivre: string;
  numeroBL: string;
  dateBL: string;

  userQuiAFacture: string;
  numeroFacture: string;
  dateFacture: string;
  positionFacture: number;

  numeroBonCommande: string;
  libelleCommandeOuOR: string;
  numeroLigne: number;

  cst: string;
  reference: string;
  designation: string;

  codeRemiseLigne: string;
  codeGestion: string;
  geree: number;

  coursDevise: number;

  prixBrut: number;
  remise: number;
  prixNet: number;
  pmp: number;
  totalNet: number;
  totalPmp: number;
  marge: number;

  prixBrutCDF: number;
  prixBrutUSD: number;

  remiseCDF: number;
  remiseUSD: number;

  prixNetCDF: number;
  prixNetUSD: number;

  pmpCDF: number;
  pmpUSD: number;

  totalNetCDF: number;
  totalNetUSD: number;

  totalPmpCDF: number;
  totalPmpUSD: number;

  margeCDF: number;
  margeUSD: number;

  pourcentageMarge: number;

  tauxTva: number;

  totalTtc: number;
  totalTtcCDF: number;
  totalTtcUSD: number;
}

export interface RapportVentePosResponse {
  kpis: RapportVenteKpiResponse[];
  details: RapportVenteDetailResponse[];
  totalGeneral: RapportVenteKpiResponse;
}

export interface RapportVenteFilterRequest {
  dateDebut: string;
  dateFin: string;
  depotId?: number | null;
  categorieId?: number | null;
  tarifId?: number | null;
  caissier?: string | null;
  devise?: string | null;
}
