export type Devise = 'USD' | 'CDF';
export type TypeTransaction = 'ENCAISSEMENT' | 'DECAISSEMENT';
export type ModePaiement = 'CASH' | 'MOBILE_MONEY' | 'BANQUE';

export type CategorieOperation =
  | 'SALAIRE'
  | 'ACHAT'
  | 'DEPENSE'
  | 'RECETTE'
  | 'REMBOURSEMENT'
  | 'AUTRE';

export type StatutSessionCaisse = 'OUVERTE' | 'FERMEE';

export interface OuvrirCaisseDTO {
  soldeInitialUSD: number;
  soldeInitialCDF: number;
  tauxChange: number; // ✅ nouveau
  note?: string;
}

export interface CloturerCaisseDTO {
  note?: string;
}

export interface OperationCaisseDTO {
  type: TypeTransaction;
  devise: Devise;
  montant: number;
  category: CategorieOperation;
  modePaiement: ModePaiement;
  description?: string;
  reference?: string;
    tauxChange?: number;

}

export interface CaisseSessionDto {
  id: number;
  dateJour: string; // yyyy-MM-dd
  statut: StatutSessionCaisse;

  dateOuverture: string; // ISO
  dateCloture?: string | null;

  soldeInitialUSD: number;
  soldeInitialCDF: number;

  soldeActuelUSD: number;
  soldeActuelCDF: number;

  openedBy?: string;
  closedBy?: string;

  noteOuverture?: string | null;
  noteCloture?: string | null;
}

export interface TransactionCaisseDto {
  id: number;
  dateTransaction: string;
  type: TypeTransaction;
  category: CategorieOperation;
  devise: Devise;
  modePaiement: ModePaiement;
  montant: number;
  sens: string;
  description?: string | null;
  reference?: string | null;
  soldeAvant?: number | null;
  soldeApres?: number | null;
  userId?: number | null;
  clientId?: number | null;
  nomClient?: string | null;
  gardienId?: number | null;
  nomGardien?: string | null;
}
