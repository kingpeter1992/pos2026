import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { ApprovisionnementService } from './approvisionnement-service';
import { SuggestionAppro } from '../../models/suggestion-appro.model';

@Injectable({
  providedIn: 'root'
})
export class ApprovisionnementStore {
  private readonly approvisionnementService = inject(ApprovisionnementService);

  readonly suggestions = signal<SuggestionAppro[]>([]);
  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly joursSelectionnes = signal<number>(30);
  readonly error = signal<string | null>(null);

  readonly ruptures = computed(() =>
    this.suggestions().filter(item => item.statutAppro === 'RUPTURE')
  );

  readonly aCommander = computed(() =>
    this.suggestions().filter(item => item.statutAppro === 'A_COMMANDER')
  );

  readonly surstock = computed(() =>
    this.suggestions().filter(item => item.statutAppro === 'SURSTOCK')
  );

  readonly totalProduits = computed(() => this.suggestions().length);

  readonly totalQuantiteACommander = computed(() =>
    this.suggestions().reduce((sum, item) => sum + Number(item.quantiteACommander || 0), 0)
  );

  readonly totalStock = computed(() =>
    this.suggestions().reduce((sum, item) => sum + Number(item.stockActuel || 0), 0)
  );

  loadSuggestions(joursCouverture?: number, force = false): void {
    const jours = joursCouverture && joursCouverture > 0
      ? joursCouverture
      : this.joursSelectionnes();

    if (this.loaded() && !force && jours === this.joursSelectionnes()) {
      return;
    }

    this.joursSelectionnes.set(jours);
    this.loading.set(true);
    this.error.set(null);

    this.approvisionnementService.getSuggestions(jours)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          this.suggestions.set(data || []);
          console.log('suggestion Réapprovisionnement automatique', data)
          this.loaded.set(true);
        },
        error: (err) => {
          console.error('Erreur chargement suggestions approvisionnement', err);
          this.error.set(
            err?.error?.message ||
            err?.message ||
            'Erreur lors du chargement des suggestions.'
          );
          this.suggestions.set([]);
          this.loaded.set(false);
        }
      });
  }

  refresh(): void {
    this.loadSuggestions(this.joursSelectionnes(), true);
  }

  clear(): void {
    this.suggestions.set([]);
    this.loading.set(false);
    this.loaded.set(false);
    this.error.set(null);
  }
}
