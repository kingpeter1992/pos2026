export interface TauxChangeRequest {
  taux: number;
  actif?: boolean;
  commentaire?: string;
}

export interface TauxChangeResponse {
  id: number;
  taux: number;
  actif: boolean;
  dateCreation: string;
  dateActivation?: string;
  commentaire?: string;
}
