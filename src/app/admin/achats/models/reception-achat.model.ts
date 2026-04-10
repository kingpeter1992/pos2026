export interface LigneReceptionRequest {
  produitId: number;
  quantiteRecue: number;
  prixUnitaire?: number;
  commentaire?: string;
}

export interface ReceptionAchatRequest {
  commandeAchatId?: number;
  referenceBonReception?: string;
  dateReception?: string;
  observateur?: string;
 depotId?: number;
  fournisseurId?: number;
  fraisTransport?: number;
  fraisDouane?: number;
  fraisManutention?: number;
  autresFrais?: number;

  lignes: LigneReceptionRequest[];
}

export interface ReceptionAchatResponse {
  id: number;
  commandeAchatId: number;
  referenceBonReception: string;
  dateReception: string;
  statut: string;
  commentaire?: string;
  refReception?: string;
  fournisseurNom?: string;
  depotNom?: string;
  refCommande?: string;
  totalMarchandise?: number;
  totalFrais?: number;
  totalGeneral?: number;
  lignes?: LigneReceptionView[];

}

export interface LigneReceptionView {
  produitId: number;
  produitNom: string;
  quantiteCommandee: number;
  quantiteDejaRecue: number;
  quantiteRestante: number;
  quantiteRecue: number;
  prixUnitaire?: number;
  commentaire?: string;
  bloquee?: boolean;
}


export interface DepotResponse {
  id: number;
  nom: string;
}
