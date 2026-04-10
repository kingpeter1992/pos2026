export interface StockProduitView {
  stockId: number;
  produitId: number;
  nomProduit: string;
  codeBarre?: string;
  categorie?: string;
  depotId: number;
  nomDepot?: string;

  quantiteDisponible: number;
  pmp: number;
  valeurStock: number;

  quantiteMinimale?: number;
  quantiteMaximale?: number;

  statutStock?: 'RUPTURE' | 'ALERTE_RUPTURE' | 'SURPLUS' | 'NORMAL';
}
