import { InventaireResponse } from "./inventaire.models";

export interface InventaireResultatResponse {
  inventaire: InventaireResponse;
  kpi: InventaireResultatKpiResponse;
  lignes: InventaireResultatLigneResponse[];
}

export interface InventaireResultatKpiResponse {
  totalArticles: number;
  articlesComptes: number;
  articlesAvecEcart: number;
  articlesSansEcart: number;

  pourcentageArticlesAvecEcart: number;

  totalStockTheorique: number;
  totalStockComptee: number;
  totalEcartQuantite: number;

  valeurTheoriqueCDF: number;
  valeurCompteeCDF: number;
  valeurEcartCDF: number;

  valeurEcartPositifCDF: number;
  valeurEcartNegatifCDF: number;

  valeurTheoriqueUSD: number;
  valeurCompteeUSD: number;
  valeurEcartUSD: number;

  pourcentageEcartValeur: number;

  bordereauxTotal: number;
  bordereauxMisAJourStock: number;

  stockTotalementMisAJour: boolean;
}

export interface InventaireResultatLigneResponse {
  depot: string;
  numeroInventaire: string;
  numeroBordereau: string;
  locator: string;
  statutBordereau: string;

  dateInventaire: string;
  dateMiseAJourStock: string;

  numeroLigne: number;

  codeArticle: string;
  designation: string;

  quantiteStockTheorique: number;
  quantiteComptee: number;
  quantiteEcart: number;

  ecart: boolean;

  pmpInventaire: number;

  valeurStockTheorique: number;
  valeurStockComptee: number;
  valeurEcart: number;

  typeVariance: string;

  stockMisAJour: boolean;

  stockActuel: number;
  pmpActuel: number;
  valeurStockActuel: number;

  commentaireComptage: string;
}
