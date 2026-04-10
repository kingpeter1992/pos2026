export interface FactureFournisseurRequest {
  fournisseurId: number;
  commandeAchatId?: number;
  receptionId?: number;
  numeroFacture: string;
  dateFacture: string;
  dateEcheance?: string;
  montantHt?: number;
  montantTva?: number;
  montantTtc: number;
  devise: string;
  commentaire?: string;
}

export interface FactureFournisseurResponse {
  id: number;
  numeroFacture: string;
  fournisseurId: number;
  fournisseurNom: string;
  commandeAchatId?: number;
  receptionId?: number;
  dateFacture: string;
  dateEcheance?: string;
  montantHt?: number;
  montantTva?: number;
  montantTtc: number;
  devise: string;
  statut: string;
  commentaire?: string;
}
