export interface PosDashboard {
  totalVentesJour: number;
  montantVentesJour: number;
  nombreTickets: number;
  panierMoyen: number;
  produitsVendus: number;
  produitsEnRupture: number;
  topProduits: TopProduit[];
}

export interface TopProduit {
  produitId: number;
  nom: string;
  quantiteVendue: number;
  montantTotal: number;
}

export interface LigneVente {
  produitId: number;
  codeBarres?: string;
  nomProduit: string;
  quantite: number;
  prixUnitaire: number;
  remise?: number;
  sousTotal: number;
}

export interface VenteRequest {
  caissier?: string;
  modePaiement: 'CASH' | 'MOBILE_MONEY' | 'CARTE' | 'VIREMENT';
  lignes: LigneVenteRequest[];
}

export interface LigneVenteRequest {
  produitId?: number;
  codeBarres?: string;
  quantite: number;
}

export interface VenteResponse {
  id: number;
  dateVente: string;
  total: number;
  modePaiement: string;
  caissier?: string;
  lignes: LigneVente[];
}

export interface RetourProduit {
  id: number;
  venteId: number;
  produitId: number;
  nomProduit: string;
  quantiteRetournee: number;
  motif: string;
  dateRetour: string;
}

export interface TicketVente {
  id: number;
  numeroTicket: string;
  venteId: number;
  dateCreation: string;
  total: number;
  modePaiement: string;
}

export interface RapportVente {
  dateDebut: string;
  dateFin: string;
  totalVentes: number;
  montantTotal: number;
  panierMoyen: number;
  produitsLesPlusVendus: TopProduit[];
}


export interface TarifVenteResponse {
  id: number;
  code: string;
  nom: string;
  description?: string;
  actif: boolean;
}

export interface TarificationLotRequest {
  tarifVenteId: number;
  produitIds: number[];
}

export interface TarificationResponse {
  produitId: number;
  produitNom: string;
  codeBarres?: string;

  categorieId?: number;
  categorieNom?: string;

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

  modeArrondi?: string;
  stockDisponible?: number;
}
