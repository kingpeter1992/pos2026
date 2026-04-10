export interface MouvementStockView {
  id: number;
  dateMouvement: string;
  typeMouvement: string;

  produitId: number;
  nomProduit: string;
  codeBarres?: string;

  depotId?: number;
  nomDepot?: string;

  quantite: number;

  prixUnitaireEntree?: number;
  fraisUnitaire?: number;
  coutUnitaireFinal?: number;

  ancienStock?: number;
  ancienPmp?: number;

  nouveauStock?: number;
  nouveauPmp?: number;

  referenceDocument?: string;
  libelle?: string;
}
