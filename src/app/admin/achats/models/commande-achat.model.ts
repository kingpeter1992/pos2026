export interface LigneCommandeAchatRequest {
  produitId: number;
  quantite: number;
  prixUnitaire: number;
  remise?: number;
}

export type Devise = 'USD' | 'CDF';
export interface CommandeAchatRequest {
  fournisseurId?: number;
  reference?: string;
  dateCommande?: string;
  dateLivraisonPrevue?: string;
  observation?: string;
  taux: number;
  devise: Devise;
  montantTotalFc?: number;
  montantTotalUsd?: number;
  tauxChangeUtilise?: number;


  lignes?: LigneCommandeAchatRequest[];
}

export interface LigneCommandeAchatResponse {
  produitCategorie: any;
  codeBarres: string | undefined;
  id: number;
  produitId: number;
  produitNom: string;
  quantite: number;
  prixUnitaire: number;
  remise?: number;
  sousTotal: number;
}

export interface CommandeAchatResponse {
  tauxChangeUtilise?: number;
  id: number;
  prefixe?: string;
  reference: string;
  refCommande: string;
  fournisseurId: number;
  fournisseurNom: string;
  dateCommande: string;
  statut: string;
  montantTotal: number;
  devise: string;
  montntBrut?: number;
  montantRemise?: number;
  taux: number;
  observation?: string;
  datePrevue?: string;
  dateLivraisonPrevue?: string;
  user: string;
  lignes: LigneCommandeAchatResponse[];
  fraisTransport?: number;
  fraisDouane?: number;
  fraisManutention?: number;
  autresFrais?: number;


}


export interface CommandeAchatListItem {
  id: number;
  prefixe?: string;
  refCommande: string;
  libelle?: string;
  dateCommande: string | Date;
  montantNet?: number;
  montantBrut?: number;
  montantTtc?: number;
  montantTotal?: number;
  devise?: string;
  statut?: string;
  positionType?: string;
  positionCommande?: string;
  dateLivraisonPrevue?: string;
  operateur?: string;
  observation?: string;
  lignes: LigneCommandeAchatResponse[];
  montantRemise?: number;
  fournisseurId?: number;
  fournisseurNom?: string;
  taux?: number;
  user?: string;

}
