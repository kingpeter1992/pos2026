export interface ImagePhotoRequest {
  nomFichier?: string;
  contentType?: string;
  url: string;
  principale?: boolean;
}

export interface ImagePhotoResponse {
  id: number;
  nomFichier?: string;
  contentType?: string;
  url: string;
  principale: boolean;
}

export interface ProduitRequest {
  codeBarres?: string;
  nom: string;
  description?: string;

  categorieId?: number | null;

  fournisseurId?: number | null;

  prixAchat?: number;
  prixVente: number;
  prixVenteFc?: number;
  prixVenteUsd?: number;
  tauxChangeUtilise?: number;

  stockMinimum: number;
  stockMaximum: number;

  actif?: boolean;
  perissable?: string;

  images?: ImagePhotoRequest[];
}


export interface ProduitResponse {
  id: number;

  codeBarres: string;
  nom: string;
  description?: string;

  categorieId?: number | null;
  categorieNom?: string;

  fournisseurId?: number | null;
  fournisseurNom?: string;

  prixAchat?: number;
  prixVente: number;

  prixVenteFc?: number;
  prixVenteUsd?: number;
  tauxChangeUtilise?: number;

  stockMinimum: number;
  stockMaximum: number;

  actif: boolean;

  perissable?: string;

  dateCreation: string;

  images: ImagePhotoResponse[];

}

export interface ImagePhotoRequest {
  nomFichier?: string;
  contentType?: string;
  url: string;
  principale?: boolean;
}


export interface ProductLabelPrintItem {
  produit: ProduitResponse;
  quantity: number;
}

export interface FlatProductLabel {
  produitId: number;
  nom: string;
  prixVente: number;
  codeBarres: string;
}
