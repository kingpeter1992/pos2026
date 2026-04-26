import { ChangeDetectionStrategy, Component, computed, EventEmitter, inject, OnInit, Output, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { InventaireStoreService } from '../../service/inventaire-service/inventaire-store.service';
import { InventaireCreateDialogComponent } from '../inventaire-create-dialog-component/inventaire-create-dialog-component';
import { InventaireResponse } from '../../model/inventaire.models';

@Component({
  selector: 'app-inventaire-component',
  templateUrl: './inventaire-component.html',
  styleUrl: './inventaire-component.css',
  standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush

})
export class InventaireComponent implements OnInit {
  readonly store = inject(InventaireStoreService);
  private readonly dialog = inject(MatDialog);

  readonly inventaire = signal<InventaireResponse | null>(null);

  readonly selectedLabel = computed(() =>
    this.inventaire()?.reference || 'Aucun inventaire sélectionné'
  );

readonly canClose = computed(() => {
  const inv = this.inventaire();

  return !!inv
    && inv.cloture !== true
    && inv.tousBordereauxStockMisAJour === true;
});

readonly canCancel = computed(() => {
  const inv = this.inventaire();

  return !!inv
    && inv.statut === 'CLOTURE'
    && this.isAdmin();
});

  ngOnInit(): void {
    this.store.loadInventaires();
  }

  createInventaire(): void {
    const dialogRef = this.dialog.open(InventaireCreateDialogComponent, {
      width: '720px',
      maxWidth: '95vw',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((created) => {
      if (created) {
        this.store.loadInventaires();
      }
    });
  }

onSelectInventaire(inv: InventaireResponse | null): void {
  this.inventaire.set(
    inv ? { ...inv } : null
  );
}

  cloturerInventaire(): void {
    const inv = this.inventaire();
    if (!inv?.id || !this.canClose()) return;

    this.store.cloturerInventaire(inv.id, this.getCurrentUsername());
    this.inventaire.set(null);
  }

  annulerInventaire(): void {
    const inv = this.inventaire();
    if (!inv?.id || !this.canCancel()) return;

    this.store.annulerInventaire(inv.id, this.getCurrentUsername());
    this.inventaire.set(null);
  }

  private getCurrentUser(): any {
    return JSON.parse(sessionStorage.getItem('auth-user') || '{}');
  }

  private getCurrentUsername(): string {
    return this.getCurrentUser()?.username || 'SYSTEM';
  }

  private isAdmin(): boolean {
    const user = this.getCurrentUser();

    return user?.roles?.includes('ADMIN')
      || user?.role === 'ADMIN'
      || user?.username === 'ADMIN';
  }
}
