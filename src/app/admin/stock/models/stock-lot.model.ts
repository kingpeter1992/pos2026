import { StatutPeremption } from './statut-peremption.enum';

export interface StockLot {
  id: number;
  produitId: number;
  produitNom: string;
  codeBarres?: string;
  depotId: number;
  depotNom: string;

  quantiteInitiale: number;
  quantiteDisponible: number;

  prixUnitaire: number;
  fraisUnitaire: number;
  coutUnitaireFinal: number;

  dateEntree?: string;
  datePeremption?: string;
  statutPeremption: StatutPeremption;

  referenceDocument?: string;
  sourceDocument?: string;
  sourceDocumentId?: number;
  numeroLot?: string;
  dateCreation?: string;
  joursRestants?: number;
  dateModification?: string;
}
