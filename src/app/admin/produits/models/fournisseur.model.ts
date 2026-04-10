export interface FournisseurRequest {
  id?: number;
  nom: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  description?: string;
  contactPersonne?: string;
  actif?: boolean;
}

export interface FournisseurResponse {
  id: number;
  nom: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  contactPersonne?: string;
  ville?: string;
  pays?: string;
  description?: string;
  actif?: boolean;
  dateCreation?: string;

}
