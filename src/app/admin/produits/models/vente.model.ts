export interface LignePanier {
  id: number;
  produitId: number;
  codeBarres?: string;
  reference?: string;
  //produit?: string;
  prix: number;
  quantite: number;
  remise: number;
  stock: number;
  stockSecurite?: number;
  imageUrl?: string;
}

export interface LigneVenteRequest {
  produitId: number;
  quantite: number;
}

export interface VenteRequest {
  caissier: string;
  modePaiement: string;
  lignes: LigneVenteRequest[];
}


export interface ProduitPickerItem {
  id: number;
  designation: string;
  codeBarres?: string;
  codebarre?: string;
  imageUrl?: string;
  image?: string;
  categorieId?: number;
  categorieNom?: string;
  quantiteDisponible?: number;
  stockDisponible?: number;
    stock?: number;

  pmp?: number;

  tarifVenteId?: number;
  tarifCode?: string;
  tarifNom?: string;

  tauxMarge?: number;
  tauxRemiseMax?: number;
  tauxRemiseAppliquee?: number;

  prixBrut?: number;
  montantRemise?: number;
  prixNet?: number;
  prixUnitaire?: number;
  prixVente?: number;
  prix?: number;
}


type ModePaiement = 'CASH' | 'MOBILE_MONEY' | 'CARTE' | 'VIREMENT';



export interface ProduitPos {
  id: number;
  nom?: string;
  codeBarres?: string;
  reference?: string;
  prixVente: number;
  stock: number;
  stockSecurite?: number;
  pmp?: number;
  imageUrl?: string;
  actif?: boolean;
  designation?: string;
  prix?: number;
  stockDisponible?: number;
  [key: string]: any;
}

export interface LignePanier {
  id: number;
  produitId: number;
  //produit?: string;
  designation?: string;
  codeBarres?: string;
  imageUrl?: string;

  prix: number;
  prixUnitaire?: number;
  prixNet?: number;
  prixBrut?: number;

  quantite: number;
  remise: number;
  totalLigne?: number;

  stockDisponible?: number;

  tarifVenteId?: number;
  tarifCode?: string;
  tarifNom?: string;

  pmp?: number;
  tauxMarge?: number;
  tauxRemiseMax?: number;
  tauxRemiseAppliquee?: number;
  montantRemise?: number;

  [key: string]: any;
}

export interface ProduitTarifiePickerResult {
  id: number;
  produitId?: number;
  designation: string;
  codeBarres?: string;
  imageUrl?: string;

  quantite?: number;
  stockDisponible?: number;

  tarifVenteId?: number;
  tarifCode?: string;
  tarifNom?: string;

  pmp?: number;
  tauxMarge?: number;
  tauxRemiseMax?: number;
  tauxRemiseAppliquee?: number;

  prixBrut?: number;
  montantRemise?: number;
  prixNet?: number;
  prixUnitaire?: number;

  categorieId?: number;
  categorieNom?: string;
}


export interface TarifVente {
  id: number;
  code: string;
  nom: string;
  description?: string | null;
  actif: boolean;
  parDefaut: boolean;
  dateCreation?: string | null;
}

export interface TarifCategorieProduitRequest {
  tarifVenteId: number;
  categorieId: number;
  tauxMarge: number;
  tauxRemiseMax: number;
  actif?: boolean;
  modeArrondi?: string;
}

export interface TarifCategorieProduitResponse {
  id: number;
  tarifVenteId: number;
  tarifCode: string;
  tarifNom: string;
  categorieId: number;
  categorieNom: string;
  tauxMarge: number;
  tauxRemiseMax: number;
  actif: boolean;
  modeArrondi: string;
}

export interface TarificationProduitRequest {
  produitId: number;
  tarifVenteId: number;
  tauxRemiseSaisie?: number;
}

export interface TarificationLotRequest {
  produitIds: number[];
  tarifVenteId: number;
}

export interface TarificationResponse {
  produitId: number;
  produitNom: string;
  codeBarres?: string | null;
  categorieId: number;
  categorieNom: string;
  tarifVenteId: number;
  tarifCode: string;
  tarifNom: string;
  pmp: number;
  tauxMarge: number;
  tauxRemiseMax: number;
  tauxRemiseAppliquee: number;
  prixBrut: number;
  montantRemise: number;
  prixNet: number;
  modeArrondi: string;
  stockDisponible: number;
}
