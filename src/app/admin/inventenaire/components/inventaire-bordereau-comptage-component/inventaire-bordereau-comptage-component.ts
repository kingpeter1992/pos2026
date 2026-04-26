import { ChangeDetectionStrategy, Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { InventaireBordereauStoreService } from '../../service/bordereau/inventaire-bordereau-store.service';
import { InventaireBordereauLigneUpdateRequest } from '../../model/inventaire-bordereau.models';

@Component({
  selector: 'app-inventaire-bordereau-comptage-component',
  templateUrl: './inventaire-bordereau-comptage-component.html',
  styleUrl: './inventaire-bordereau-comptage-component.css',
  standalone : false,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventaireBordereauComptageComponent implements OnChanges {
readonly store = inject(InventaireBordereauStoreService);

 @Input({ required: true }) bordereauId!: number;
  @Input() bordereauReference = '';
  @Input() inventaireReference = '';
  @Input() depotNom = '';
  @Input() locatorCode = '';
  @Input() statutBordereau = '';
  @Input() afficherQuantiteTheorique = true;
@Input() stockMisAJour = false;

  lignesEditables: any[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bordereauId']?.currentValue) {
      this.loadLignes();
    }
  }

  private loadLignes(): void {
    if (!this.bordereauId) return;

    this.store.loadLignes(this.bordereauId, (rows) => {
      this.lignesEditables = rows.map(row => ({
        ...row,
        quantiteComptee: row.quantiteComptee ?? null,
        commentaire: row.commentaire ?? ''
      }));
    });
  }

  saveComptage(): void {
    if (!this.bordereauId) return;

    const payload: InventaireBordereauLigneUpdateRequest[] = this.lignesEditables.map(row => ({
      id: row.id,
      quantiteComptee:
        row.quantiteComptee !== null &&
        row.quantiteComptee !== undefined &&
        row.quantiteComptee !== ''
          ? Number(row.quantiteComptee)
          : null,
      commentaire: row.commentaire || null,
      saisiPar: 'ADMIN POS'
    }));

    this.store.saveLignes(this.bordereauId, payload, {
      next: () => this.loadLignes()
    });
  }

  validerBordereau(): void {
    if (!this.bordereauId) return;

    this.store.validerBordereau(this.bordereauId, 'ADMIN POS', {
      next: () => this.loadLignes()
    });
  }

  miseAJourStock(): void {
  if (!this.bordereauId) return;

  this.store.miseAJourStock(this.bordereauId, 'ADMIN POS', {
    next: () => this.loadLignes()
  });
}

canUpdateStock(): boolean {
  return this.statutBordereau === 'VALIDE' && !this.stockMisAJour;
}

  canEdit(): boolean {
    return this.statutBordereau !== 'VALIDE' && this.statutBordereau !== 'ANNULE';
  }
}
