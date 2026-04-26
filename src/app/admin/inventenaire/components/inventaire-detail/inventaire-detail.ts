import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { InventaireStoreService } from '../../service/inventaire-service/inventaire-store.service';
import { InventaireBordereauStoreService } from '../../service/bordereau/inventaire-bordereau-store.service';
import { MatDialog } from '@angular/material/dialog';
import { InventaireCreateBordereauDialog } from '../inventaire-create-bordereau-dialog/inventaire-create-bordereau-dialog';

@Component({
  selector: 'app-inventaire-detail',
  templateUrl: './inventaire-detail.html',
  styleUrl: './inventaire-detail.css',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush

})
export class InventaireDetail implements OnInit {
 readonly store = inject(InventaireStoreService);
  readonly bordereauStore = inject(InventaireBordereauStoreService);

  private readonly route = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly inventaire = this.store.selectedInventaire;
  readonly bordereaux = this.bordereauStore.bordereaux;
  readonly variances = this.store.variances;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.store.loadInventaireDetail(id);
      this.bordereauStore.loadBordereaux(id);
    }
  }

  openGenererBordereauxDialog(inv: any): void {
    const ref = this.dialog.open(InventaireCreateBordereauDialog, {
      width: '620px',
      maxWidth: '95vw',
      disableClose: true,
      data: { inventaireId: inv.id }
    });

    ref.afterClosed().subscribe((rows) => {
      if (rows) {
        this.bordereauStore.loadBordereaux(inv.id);
      }
    });
  }

  openBordereauDetail(row: any): void {
    this.router.navigate(['/admin/inventaire/bordereaux', row.id]);
  }

  lancerVariances(): void {
    const id = this.inventaire()?.id;
    if (!id) return;
    this.store.lancerVariances(id);
  }

  validerInventaire(): void {
    const id = this.inventaire()?.id;
    if (!id) return;
    this.store.validerInventaire(id, 'ADMIN POS');
  }

  cloturerInventaire(): void {
    const id = this.inventaire()?.id;
    if (!id) return;
    this.store.cloturerInventaire(id, 'ADMIN POS');
  }

  annulerInventaire(): void {
    const id = this.inventaire()?.id;
    if (!id) return;
    this.store.annulerInventaire(id, 'ADMIN POS', 'Annulation inventaire');
  }

  // canGenererBordereaux(): boolean {
  //   const inv = this.inventaire();
  //   return !!inv
  //     && (inv.statut === 'OUVERT' || inv.statut === 'EN_COMPTAGE')
  //     && !inv.bordereauxGeneres;
  // }

  hasBordereaux(): boolean {
    return this.bordereaux().length > 0;
  }

canLaunchVariance(): boolean {
  const statut = this.inventaire()?.statut;
  const bordereaux = this.bordereaux();

  if (!statut) return false;

  // Inventaire brouillon interdit
  if (statut === 'BROUILLON') return false;

  // Aucun bordereau interdit
  if (!bordereaux || bordereaux.length === 0) return false;

  // Si au moins un bordereau est BROUILLON, interdit
  const hasBordereauBrouillon = bordereaux.some(b => b.statut === 'BROUILLON');

  if (hasBordereauBrouillon) return false;

  return statut === 'EN_COMPTAGE' || statut === 'VARIANCE_LANCEE';
}
  canValidateInventaire(): boolean {
    return this.inventaire()?.statut === 'VARIANCE_LANCEE';
  }

  canCloseInventaire(): boolean {
    return this.inventaire()?.statut === 'VALIDE';
  }


  canGenererBordereaux(): boolean {
  const inv = this.inventaire();

  return !!inv
    && !this.hasBordereaux()
    && !inv.bordereauxGeneres
    && inv.statut !== 'CLOTURE'
    && inv.statut !== 'ANNULE';
}

canCancelInventaire(): boolean {
  const inv = this.inventaire();

  return !!inv
    && inv.statut === 'CLOTURE'
    && this.isAdmin();
}

private isAdmin(): boolean {
  const user = JSON.parse(sessionStorage.getItem('auth-user') || '{}');

  return user?.roles?.includes('ADMIN')
      || user?.role === 'ADMIN'
      || user?.username === 'ADMIN POS';
}
}
