import { Component, computed, OnInit, signal } from '@angular/core';
import { SuggestionAppro } from '../../models/suggestion-appro.model';
import { ApprovisionnementStore } from '../../service/approservice/approvisionnement.store';

@Component({
  selector: 'app-suggestions-reapprovisionnement-component',
  templateUrl: './suggestions-reapprovisionnement-component.html',
  styleUrl: './suggestions-reapprovisionnement-component.css',
  standalone :false
})
export class SuggestionsReapprovisionnementComponent implements OnInit{
  readonly filtreStatut = signal<'TOUS' | 'RUPTURE' | 'A_COMMANDER' | 'NORMAL' | 'SURSTOCK'>('TOUS');
  readonly search = signal<string>('');

  readonly periodeOptions = [
    { label: '7 jours', value: 7 },
    { label: '30 jours', value: 30 },
    { label: '90 jours', value: 90 }
  ];

  readonly rows = computed(() => {
    const data = this.store.suggestions();
    const statut = this.filtreStatut();
    const keyword = this.search().trim().toLowerCase();

    return data.filter(item => {
      const matchStatut = statut === 'TOUS' || item.statutAppro === statut;

      const texte = `${item.produitNom || ''} ${item.codeBarres || ''} ${item.categorieNom || ''}`.toLowerCase();
      const matchSearch = !keyword || texte.includes(keyword);

      return matchStatut && matchSearch;
    });
  });

  constructor(public store: ApprovisionnementStore) {}

  ngOnInit(): void {
    this.store.loadSuggestions(30, true);
  }

  changerPeriode(jours: number): void {
    this.store.loadSuggestions(jours, true);
  }

  setFiltreStatut(value: 'TOUS' | 'RUPTURE' | 'A_COMMANDER' | 'NORMAL' | 'SURSTOCK'): void {
    this.filtreStatut.set(value);
  }

  onSearch(value: string): void {
    this.search.set(value ?? '');
  }

  trackByProduit(_: number, item: SuggestionAppro): number {
    return item.produitId;
  }

  asNumber(value: unknown): number {
    return Number(value || 0);
  }

  badgeClass(statut: string): string {
    switch (statut) {
      case 'RUPTURE':
        return 'rupture';
      case 'A_COMMANDER':
        return 'a-commander';
      case 'SURSTOCK':
        return 'surstock';
      default:
        return 'normal';
    }
  }

  getTauxCouverture(row: SuggestionAppro): number {
    const stock = this.asNumber(row.stockActuel);
    const cible = this.asNumber(row.stockCible);

    if (cible <= 0) return 0;

    const taux = (stock / cible) * 100;
    return Math.max(0, Math.min(100, taux));
  }
}
