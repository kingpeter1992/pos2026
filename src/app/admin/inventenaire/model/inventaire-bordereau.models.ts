export type StatutBordereauInventaire =
  | 'BROUILLON'
  | 'SAISI'
  | 'VALIDE'
  | 'STOCK_MIS_A_JOUR'
  | 'ANNULE';

export interface InventaireGenererBordereauxRequest {
  tailleBordereau: number;
  afficherQuantiteTheorique: boolean;
  creePar?: string | null;
}

export interface InventaireBordereau {
  id: number;
  reference: string;
  numeroOrdre: number;
  nombreLignes: number;
  afficherQuantiteTheorique: boolean;
  stockMisAJour: boolean;
  statut: StatutBordereauInventaire;

  agentComptage?: string | null;
  validePar?: string | null;
  dateSaisie?: string | null;
  dateValidation?: string | null;
  dateMiseAJourStock?: string | null;

  commentaire?: string | null;
  locatorId?: number | null;
  locatorCode?: string | null;
}

export interface InventaireBordereauLigneResponse {
  id: number;
  numeroLigne: number;
  inventaireArticleId: number;
  codeArticle: string | null;
  designation: string | null;
  depotNom: string | null;
  locatorCode: string | null;
  quantiteTheorique: number | null;
  quantiteComptee: number | null;
  commentaire: string | null;
}

export interface InventaireBordereauLigneUpdateRequest {
  id: number;
  quantiteComptee: number | null;
  commentaire?: string | null;
  saisiPar?: string | null;
}
