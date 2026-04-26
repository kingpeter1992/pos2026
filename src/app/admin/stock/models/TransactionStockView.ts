export interface TransactionStockView {
  id: number;
  dateTransaction: string;
  typeTransaction: string;

  produitId: number | null;
  produitNom: string | null;

  depotId: number | null;
  depotNom: string | null;

  quantite: number;
  stockAvant: number;
  stockApres: number;

  pmpAvant: number;
  pmpApres: number;

  prixUnitaire: number;
  fraisUnitaire: number;
  coutUnitaireFinal: number;

  referenceDocument: string | null;
  sourceDocument: string | null;
  sourceDocumentId: number | null;

  libelle: string | null;
  utilisateur: string | null;
}
