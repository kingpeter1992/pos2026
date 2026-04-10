export interface CategorieRequest {
  nom: string;
  description?: string;
    actif: boolean;

}

export interface CategorieResponse {
  id: number;
  nom: string;
  description?: string;
  actif: boolean;
  dateCreation: string;
}
