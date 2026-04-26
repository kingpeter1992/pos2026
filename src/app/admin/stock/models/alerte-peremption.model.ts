import { StatutPeremption } from './statut-peremption.enum';

export interface AlertePeremption {
  lotId: number;
  produitId: number;
  produitNom: string;
  depotNom: string;
  quantiteDisponible: number;
  datePeremption?: string;
  joursRestants: number;
  statutPeremption: StatutPeremption;
  niveauAlerte: string;
}
