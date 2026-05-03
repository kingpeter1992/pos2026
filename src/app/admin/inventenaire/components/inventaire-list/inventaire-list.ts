import { ChangeDetectionStrategy, Component, computed, EventEmitter, inject, Output, signal } from '@angular/core';
import { InventaireStoreService } from '../../service/inventaire-service/inventaire-store.service';
import { Router } from '@angular/router';
import { InventaireResponse } from '../../model/inventaire.models';

@Component({
  selector: 'app-inventaire-list',
  templateUrl: './inventaire-list.html',
  styleUrl: './inventaire-list.css',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventaireList {
readonly store = inject(InventaireStoreService);
  private readonly router = inject(Router);

  @Output() selectedInventaire = new EventEmitter<InventaireResponse | null>();

  readonly search = signal('');
  readonly selectedId = signal<number | null>(null);

  readonly filteredInventaires = computed(() => {
    const term = this.search().trim().toLowerCase();
    const rows = this.store.inventaires();

    if (!term) return rows;

    return rows.filter(item =>
      item.reference?.toLowerCase().includes(term) ||
      item.depotNom?.toLowerCase().includes(term) ||
      item.locatorCode?.toLowerCase().includes(term) ||
      item.type?.toLowerCase().includes(term) ||
      item.statut?.toLowerCase().includes(term)
    );
  });

  canViewDetails(inventaire: InventaireResponse): boolean {
    return inventaire.statut !== 'BROUILLON';
  }

  goToDetails(id: number): void {
    this.router.navigate(['/admin/inventaire/details', id]);
  }

  ouvrir(id: number): void {
    this.store.ouvrirInventaire(id);
  }

  statutSeverity(statut: string): 'success' | 'info' | 'warn' | 'danger' | 'contrast' | undefined {
    switch (statut) {
      case 'BROUILLON': return 'contrast';
      case 'OUVERT': return 'info';
      case 'EN_COMPTAGE': return 'warn';
      case 'VARIANCE_LANCEE': return 'warn';
      case 'VALIDE': return 'success';
      case 'CLOTURE': return 'contrast';
      default: return undefined;
    }
  }

  statutLabel(statut: string): string {
    switch (statut) {
      case 'BROUILLON': return 'Brouillon';
      case 'OUVERT': return 'Ouvert';
      case 'EN_COMPTAGE': return 'En comptage';
      case 'VARIANCE_LANCEE': return 'Variance lancée';
      case 'VALIDE': return 'Validé';
      case 'CLOTURE': return 'Clôturé';
      default: return statut || '-';
    }
  }

  canCloturer(row: InventaireResponse): boolean {
    return row.cloture !== true
      && row.tousBordereauxStockMisAJour === true;
  }

  cloturer(inventaire: InventaireResponse): void {
    if (!inventaire?.id) return;
    this.store.cloturerInventaire(inventaire.id, 'ADMIN POS');
  }

  toggleSelection(row: InventaireResponse): void {
    if (this.selectedId() === row.id) {
      this.selectedId.set(null);
      this.selectedInventaire.emit(null);
      return;
    }

    this.selectedId.set(row.id);
    this.selectedInventaire.emit({ ...row });
  }

  isSelected(row: InventaireResponse): boolean {
    return this.selectedId() === row.id;
  }

  rowClass(row: InventaireResponse): string {
    return this.isSelected(row) ? 'selected-row' : '';
  }
}
