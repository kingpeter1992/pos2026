export interface ReceptionLocatorPreparationLigneResponse {
  produitId: number;
  produitNom: string;
  quantiteRecue: number;
  locatorId?: number;
  locatorCode?: string;
}

export interface ReceptionLocatorPreparationResponse {
  receptionId: number;
  refReception: string;
  depotId: number;
  depotNom: string;
  lignes: ReceptionLocatorPreparationLigneResponse[];
}

export interface ReceptionLocatorLigneRequest {
  produitId: number;
  locatorCode: string;
  quantiteRangee: number;
}

export interface ReceptionLocatorRequest {
  lignes: ReceptionLocatorLigneRequest[];
}
