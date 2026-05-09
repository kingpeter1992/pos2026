export type TypeRequisition =
  | 'VENTE_REALISEE'
  | 'VENTE_MANQUEE'
  | 'NOUVEAU_PRODUIT_DEMANDE';

export interface RequisitionCreateRequest {
  produitId: number;
  depotId?: number | null;
  locatorId?: number | null;
  quantite: number;
  type: TypeRequisition;
  produitExistant?: boolean;
  origine?: string;
  commentaire?: string;
  creePar?: string;
}

export interface RequisitionResponse {
  id: number;

  produitId: number;
  produitNom: string;
  codeBarres: string;
  categorieNom: string;

  depotId?: number | null;
  depotNom?: string | null;

  locatorId?: number | null;
  locatorNom?: string | null;

  totalDemandes: number;
  totalVentes: number;
  totalVentesManquees: number;

  totalQuantiteVendue: number;
  totalQuantiteDemandeeNonVendue: number;

  stockActuel?: number;

  produitExistant: boolean;
  origine: string;

  statut?: string;

  tauxSatisfaction: number;
  tauxManque: number;

  derniereDateDemande?: string;
  derniereDemande?: string;

  commentaire?: string;
}

export interface RequisitionHistorique {
  id: number;

  produit?: any;
  depot?: any;
  locator?: any;

  type: TypeRequisition;

  quantiteDemandee: number;
  quantiteVendue: number;

  nombreDemandes: number;
  nombreVentes: number;
  nombreVentesManquees: number;

  produitExistant: boolean;
  origine: string;

  date: string;
  dateHeure: string;

  commentaire?: string;
  creePar?: string;
}

export interface RequisitionKpi {
  totalDemandes: number;
  totalVentes: number;
  totalVentesManquees: number;
  totalQuantiteVendue: number;
  totalQuantiteDemandeeNonVendue: number;
  tauxSatisfaction: number;
  tauxManque: number;
}
