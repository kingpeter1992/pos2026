export interface StockProduitView {
  tauxChangeUtilise?: number;
  pmpFc?: number;
  pmpUsd?: number;
  valeurStockFc?: number;
  valeurStockUsd?: number;

  stockId: number;
  produitId: number;
  nomProduit: string;
  codeBarre?: string;
  categorieId?: number;
  categorie?: string;
  depotId: number;
  nomDepot?: string;
  locatorId: number;
  locatorCode?: string

  quantiteDisponible: number;
  pmp: number;
  valeurStock: number;

  stockMaximum?: number;
  stockMinimum?: number;

  statutStock?: 'RUPTURE' | 'ALERTE_RUPTURE' | 'SURPLUS' | 'NORMAL';

  tarifVenteId?: number;
  tarifCode?: string;
  tarifNom?: string;

  tauxMarge?: number;
  margeUnitaire?: number;
  prixVenteUnitaire?: number;
  margeTotaleStock?: number;
}


export interface ProvisionStockResponse {
  produitId: number;
  codeBarres: string;
  produitNom: string;
  categorieNom: string;

  quantiteDisponible: number;

  tauxChangeUtilise: number;

  pmp: number;
  pmpFc: number;
  pmpUsd: number;

  valeurStock: number;
  valeurStockFc: number;
  valeurStockUsd: number;

  joursSansVente: number;
  tauxProvision: number;

  montantProvision: number;
  montantProvisionFc: number;
  montantProvisionUsd: number;

  niveauRisque: 'FAIBLE' | 'MOYEN' | 'ELEVE' | 'TOTAL';
}

export interface ProvisionStockDashboardResponse {
  valeurStockTotale: number;
  provisionTotale: number;
  nombreProduits: number;
  nombreProduitsProvisionnes: number;
  lignes: ProvisionStockResponse[];
}

