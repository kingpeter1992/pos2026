export type TypeInventaire = 'GLOBAL' | 'TOURNANT' | 'CIBLE';
export type StatutInventaire =
  | 'BROUILLON'
  | 'OUVERT'
  | 'EN_COMPTAGE'
  | 'VARIANCE_LANCEE'
  | 'VALIDE'
  | 'CLOTURE'
  | 'ANNULE';

export interface InventaireResponse {
  id: number;
  reference: string;
  type: TypeInventaire;
  statut: StatutInventaire;
  depotId: number | null;
  depotNom: string | null;
  locatorId: number | null;
  locatorCode: string | null;
  dateInventaire: string | null;
  dateOuverture: string | null;
  dateValidation: string | null;
  dateCloture: string | null;
  memorise: boolean;
  gelStockTheorique: boolean;
  varianceLancee: boolean;
  valide: boolean;
  cloture: boolean;
  commentaire: string | null;
    bordereauxGeneres: boolean;
  annule?: boolean;
  tousBordereauxStockMisAJour?: boolean;




}

export interface InventaireCreateRequest {
  type: TypeInventaire;
  depotId: number;
  locatorId?: number | null;
  dateInventaire?: string | null;
  commentaire?: string | null;
  memorise?: boolean;
  gelStockTheorique?: boolean;
  creePar?: string | null;
}

export interface InventaireArticleResponse {
  id: number;
  produitId: number;
  codeArticle: string | null;
  designation: string | null;
  depotNom: string | null;
  locatorCode: string | null;
  stockTheorique: number | null;
  stockPhysiqueRetenu: number | null;
  ecartQuantite: number | null;
  valeurEcart: number | null;
  compte: boolean;
  dernierCommentaire?: string | null;
}

export interface InventaireVariance {
  id: number;

  // 🔗 Liens métier
  inventaireId: number | null;
  inventaireArticleId: number | null;

  // 📦 Produit
  produitId: number | null;
  produitNom: string | null;
  codeBarres: string | null;

  // 📂 Catégorie
  categorieId: number | null;
  categorieNom: string | null;

  // 🏬 Dépôt
  depotId: number | null;
  depotNom: string | null;

  // 📍 Locator
  locatorId: number | null;
  locatorCode: string | null;

  // 📊 Données de variance
  stockTheorique: number;
  stockPhysiqueRetenu: number;
  ecart: number;

  // 💰 Valorisation
  pmp: number | null;
  valeurEcart: number | null;

  // 📌 Type
  type: 'ENTREE' | 'SORTIE' | 'NEANT';

  // ✅ Statut
  appliquee: boolean;
  dateApplication: string | null;
}

export interface DashboardInventaireKpi {
  totalInventaires: number;
  brouillons: number;
  ouverts: number;
  enComptage: number;
  varianceLancee: number;
  valides: number;
  clotures: number;
  totalArticlesComptes: number;
  totalValeurEcart: number;
}



