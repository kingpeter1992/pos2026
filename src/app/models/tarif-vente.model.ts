export interface TarifVente {
  id: number;
  code: string;
  nom: string;
  description?: string;
  actif: boolean;
  parDefaut: boolean;
  dateCreation?: string;
  dateModification?: string;
}

export interface CreateTarifVenteRequest {
  code: string;
  nom: string;
  description?: string;
  actif: boolean;
  parDefaut: boolean;
}

export interface UpdateTarifVenteRequest {
  code: string;
  nom: string;
  description?: string;
  actif: boolean;
  parDefaut: boolean;
}
