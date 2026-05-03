export interface LigneReceptionRequest {
  produitId: number;
  quantiteRecue: number;

  // Prix principal en FC
  prixAchatUnitaire?: number;
  prixAchatUnitaireFc?: number;
  prixAchatUnitaireUsd?: number;

  // Taux utilisé au moment de la réception
  tauxChangeUtilise?: number;

  // Montants ligne
  montantLigneFc?: number;
  montantLigneUsd?: number;

  commentaire?: string;
  datePeremption?: string;
  numeroLot?: string;
}

export interface ReceptionAchatRequest {
  commandeAchatId?: number;
  referenceBonReception?: string;
  dateReception?: string;
  observateur?: string;

  depotId?: number;
  fournisseurId?: number;

  // Taux réception
  tauxChangeUtilise?: number;

  // Frais en FC
  fraisTransport?: number;
  fraisDouane?: number;
  fraisManutention?: number;
  autresFrais?: number;

  // Totaux réception
  montantMarchandiseFc?: number;
  montantMarchandiseUsd?: number;

  montantFraisFc?: number;
  montantFraisUsd?: number;

  montantTotalFc?: number;
  montantTotalUsd?: number;

  lignes: LigneReceptionRequest[];
}

export interface ReceptionAchatLigneResponse {
  id?: number;

  produitId?: number;
  produitNom?: string;
  categorieId?: number;
  categorieNom?: string;

  quantiteRecue?: number;

  // Prix principal en FC
  prixAchatUnitaire?: number;
  prixAchatUnitaireFc?: number;
  prixAchatUnitaireUsd?: number;

  // Taux historisé ligne
  tauxChangeUtilise?: number;

  // Montant achat
  montantAchat?: number;
  montantLigneFc?: number;
  montantLigneUsd?: number;

  // Frais répartis
  partFrais?: number;
  partFraisUsd?: number;

  fraisUnitaire?: number;
  fraisUnitaireUsd?: number;

  // Coût final
  coutUnitaireFinal?: number;
  coutUnitaireFinalUsd?: number;

  montantFinalLigneFc?: number;
  montantFinalLigneUsd?: number;

  commentaire?: string;
  datePeremption?: string;
  numeroLot?: string;
}

export interface ReceptionAchatResponse {
  id?: number;
  refReception?: string;
  referenceBonReception?: string;
  dateReception?: string;
  statut?: string;

  depotId?: number;
  depotNom?: string;

  fournisseurId?: number;
  fournisseurNom?: string;

  commandeAchatId?: number;
  refCommande?: string;

  observateur?: string;

  // Devise principale = FC
  tauxChangeUtilise?: number;

  // Anciens champs compatibles
  totalMarchandise?: number;
  totalFrais?: number;
  totalGeneral?: number;

  // Nouveaux champs FC / USD
  montantMarchandiseFc?: number;
  montantMarchandiseUsd?: number;

  montantFraisFc?: number;
  montantFraisUsd?: number;

  montantTotalFc?: number;
  montantTotalUsd?: number;

  lignes?: ReceptionAchatLigneResponse[];
}

export interface DepotResponse {
  id: number;
  nom: string;
}
