export interface SuggestionAppro {
  produitId: number;
  produitNom: string;
  codeBarres?: string;
  categorieNom?: string;

  stockActuel: number;
  quantiteVendue30Jours: number;
  rotationJournaliere: number;

  delaiApprovisionnementJours: number;
  joursSecurite: number;
  couvertureCibleJours: number;

  stockSecurite: number;
  pointCommande: number;
  stockCible: number;
  quantiteACommander: number;

  statutAppro: 'RUPTURE' | 'A_COMMANDER' | 'NORMAL' | 'SURSTOCK';
  joursCouvertureRestants?: number | null;
}
