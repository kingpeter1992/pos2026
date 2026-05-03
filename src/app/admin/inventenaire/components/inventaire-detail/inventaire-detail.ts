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

  readonly totalBordereaux = computed(() => this.bordereaux().length);

  readonly bordereauxStockMaj = computed(() =>
    this.bordereaux().filter(b => b.stockMisAJour === true).length
  );

  readonly progressionStockMaj = computed(() => {
    const total = this.totalBordereaux();
    if (!total) return 0;
    return Math.round((this.bordereauxStockMaj() / total) * 100);
  });

  readonly totalLignes = computed(() =>
    this.bordereaux().reduce((sum, b) => sum + Number(b.nombreLignes || 0), 0)
  );

  readonly totalValeurEcart = computed(() =>
    this.variances().reduce((sum, v) => sum + Number(v.valeurEcart || 0), 0)
  );

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (id) {
      this.store.loadInventaireDetail(id);
      this.bordereauStore.loadBordereaux(id);
    }
  }

  openGenererBordereauxDialog(inv: any): void {
    const ref = this.dialog.open(InventaireCreateBordereauDialog, {
      width: '680px',
      maxWidth: '96vw',
      disableClose: true,
      panelClass: 'premium-dialog',
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

  back(): void {
    this.router.navigate(['/admin/inventaire']);
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

  hasBordereaux(): boolean {
    return this.bordereaux().length > 0;
  }

  canLaunchVariance(): boolean {
    const statut = this.inventaire()?.statut;
    const bordereaux = this.bordereaux();

    if (!statut) return false;
    if (statut === 'BROUILLON') return false;
    if (!bordereaux || bordereaux.length === 0) return false;

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

  statutClass(statut: string): string {
    return `status-${(statut || '').toLowerCase().replace('_', '-')}`;
  }

  statutLabel(statut: string): string {
    switch (statut) {
      case 'BROUILLON': return 'Brouillon';
      case 'OUVERT': return 'Ouvert';
      case 'EN_COMPTAGE': return 'En comptage';
      case 'VARIANCE_LANCEE': return 'Variance lancée';
      case 'VALIDE': return 'Validé';
      case 'CLOTURE': return 'Clôturé';
      case 'ANNULE': return 'Annulé';
      default: return statut || '-';
    }
  }

  private isAdmin(): boolean {
    const user = JSON.parse(sessionStorage.getItem('auth-user') || '{}');

    return user?.roles?.includes('ADMIN')
      || user?.role === 'ADMIN'
      || user?.username === 'ADMIN POS';
  }
}
