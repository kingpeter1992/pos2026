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
  prixVente: number;
  stockMinimum: number;
    stockMaximum:number
    perissable?:string

  images?: ImagePhotoRequest[];
}

export interface ProduitResponse {
  id: number;
  codeBarres: string;
  nom: string;
  description?: string;
  categorieId?: number | null;
  categorieNom?: string;
  prixVente: number;
  prixAchat?: number;
  stockMinimum: number;
  stockMaximum:number
  actif: boolean;
  dateCreation: string;
  barcodeUrl: string;
  perisable?:string
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
