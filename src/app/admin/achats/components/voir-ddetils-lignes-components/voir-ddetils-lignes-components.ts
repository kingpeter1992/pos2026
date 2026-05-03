import { Component, computed, Inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommandeAchatStore } from '../../service/achat/CommandeAchatStore';

@Component({
  selector: 'app-voir-ddetils-lignes-components',

  templateUrl: './voir-ddetils-lignes-components.html',
  styleUrl: './voir-ddetils-lignes-components.css',
  standalone: false
})
export class VoirDdetilsLignesComponents implements OnInit {
    displayedColumns: string[] = [
      'numero',
      'produit',
      'suiviQuantite',
      'prixUnitaire',
      'remise',
      'total'
    ];

  loading = signal<boolean>(true);
  commande = signal<any | null>(null);
  lignes = signal<any[]>([]);

  totalQuantite = computed(() =>
    this.lignes().reduce((sum, l) => sum + this.getQuantiteCommandee(l), 0)
  );

  totalQuantiteRecue = computed(() =>
    this.lignes().reduce((sum, l) => sum + this.getQuantiteRecue(l), 0)
  );

  totalQuantiteRestante = computed(() =>
    this.lignes().reduce((sum, l) => sum + this.getQuantiteRestante(l), 0)
  );

  tauxReceptionGlobal = computed(() => {
    const totalCmd = this.totalQuantite();
    const totalRec = this.totalQuantiteRecue();

    if (totalCmd <= 0) return 0;

    return Math.min(100, Math.round((totalRec / totalCmd) * 100));
  });

  totalRemiseFc = computed(() =>
    this.lignes().reduce((sum, l) => sum + this.getRemiseFc(l), 0)
  );

  totalRemiseUsd = computed(() =>
    this.lignes().reduce((sum, l) => sum + this.getRemiseUsd(l), 0)
  );

  totalMontantFc = computed(() =>
    this.lignes().reduce((sum, l) => sum + this.getTotalLigneFc(l), 0)
  );

  totalMontantUsd = computed(() =>
    this.lignes().reduce((sum, l) => sum + this.getTotalLigneUsd(l), 0)
  );

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { commandeId: number },
    private dialogRef: MatDialogRef<VoirDdetilsLignesComponents>,
    private commandeStore: CommandeAchatStore,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadCommande();
  }

  loadCommande(): void {
    const commandeId = Number(this.data?.commandeId);

    if (!commandeId) {
      this.loading.set(false);
      this.snackBar.open('Commande introuvable.', 'Fermer', { duration: 3000 });
      return;
    }

    try {
      const cmd = this.commandeStore.getById(commandeId);

      if (!cmd) {
        this.loading.set(false);
        this.snackBar.open('Aucune commande trouvée pour cet identifiant.', 'Fermer', { duration: 3000 });
        return;
      }

      this.commande.set(cmd);
      this.lignes.set(cmd?.lignes ?? []);
      this.loading.set(false);
    } catch (error) {
      console.error('Erreur chargement détail commande :', error);
      this.loading.set(false);
      this.snackBar.open('Erreur lors du chargement des détails.', 'Fermer', { duration: 3000 });
    }
  }

  close(): void {
    this.dialogRef.close();
  }

  getProduitLabel(ligne: any): string {
    return (
      ligne?.produitNom ||
      ligne?.designation ||
      ligne?.libelle ||
      ligne?.nomProduit ||
      `Produit #${ligne?.produitId ?? '-'}`
    );
  }

  getQuantiteCommandee(ligne: any): number {
    return Number(ligne?.quantite ?? ligne?.qte ?? ligne?.quantiteCommandee ?? 0);
  }

  getQuantiteRecue(ligne: any): number {
    return Number(ligne?.quantiteRecue ?? ligne?.qteRecue ?? ligne?.recu ?? 0);
  }

  getQuantiteRestante(ligne: any): number {
    const reste = this.getQuantiteCommandee(ligne) - this.getQuantiteRecue(ligne);
    return reste > 0 ? reste : 0;
  }

  getTauxReception(ligne: any): number {
    const commandee = this.getQuantiteCommandee(ligne);
    const recue = this.getQuantiteRecue(ligne);

    if (commandee <= 0) return 0;

    const taux = (recue / commandee) * 100;
    return Math.min(100, Math.round(taux));
  }

  getEtatReceptionLabel(ligne: any): string {
    const commandee = this.getQuantiteCommandee(ligne);
    const recue = this.getQuantiteRecue(ligne);

    if (recue <= 0) return 'Non reçue';
    if (recue < commandee) return 'Partielle';
    if (recue === commandee) return 'Complète';
    return 'Sur-réception';
  }

  getEtatReceptionClass(ligne: any): string {
    const commandee = this.getQuantiteCommandee(ligne);
    const recue = this.getQuantiteRecue(ligne);

    if (recue <= 0) return 'etat-none';
    if (recue < commandee) return 'etat-partial';
    if (recue === commandee) return 'etat-complete';
    return 'etat-over';
  }

  getBarWidth(ligne: any): string {
    return `${this.getTauxReception(ligne)}%`;
  }

  getTauxCommande(): number {
    const cmd = this.commande();
    return Number(cmd?.tauxChangeUtilise ?? cmd?.taux ?? 0);
  }

  getPrixUnitaireFc(ligne: any): number {
    return Number(
      ligne?.prixUnitaireFc ??
      ligne?.prixUnitaire ??
      ligne?.pu ??
      0
    );
  }

  getPrixUnitaireUsd(ligne: any): number {
    const usd = ligne?.prixUnitaireUsd;

    if (usd != null) {
      return Number(usd);
    }

    const taux = Number(ligne?.tauxChangeUtilise ?? this.getTauxCommande() ?? 0);
    return taux > 0 ? this.getPrixUnitaireFc(ligne) / taux : 0;
  }

  getRemiseFc(ligne: any): number {
    return Number(
      ligne?.montantRemiseFc ??
      ligne?.montantRemise ??
      ligne?.remise ??
      0
    );
  }

  getRemiseUsd(ligne: any): number {
    const usd = ligne?.montantRemiseUsd;

    if (usd != null) {
      return Number(usd);
    }

    const taux = Number(ligne?.tauxChangeUtilise ?? this.getTauxCommande() ?? 0);
    return taux > 0 ? this.getRemiseFc(ligne) / taux : 0;
  }

  getTotalLigneFc(ligne: any): number {
    const total =
      ligne?.montantLigneFc ??
      ligne?.montantTotalFc ??
      ligne?.montantLigne ??
      ligne?.montantTotal ??
      ligne?.totalLigne;

    if (total != null) {
      return Number(total);
    }

    return Math.max(
      0,
      this.getQuantiteCommandee(ligne) * this.getPrixUnitaireFc(ligne) - this.getRemiseFc(ligne)
    );
  }

  getTotalLigneUsd(ligne: any): number {
    const usd =
      ligne?.montantLigneUsd ??
      ligne?.montantTotalUsd;

    if (usd != null) {
      return Number(usd);
    }

    const taux = Number(ligne?.tauxChangeUtilise ?? this.getTauxCommande() ?? 0);
    return taux > 0 ? this.getTotalLigneFc(ligne) / taux : 0;
  }

  formatFc(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  }

  formatUsd(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value || 0));
  }

  getStatutClass(): string {
    const statut = (this.commande()?.statut || '').toUpperCase();

    if (statut.includes('PARTIEL')) return 'status-partiel';
    if (statut.includes('BROUILLON')) return 'status-brouillon';
    if (statut.includes('EN_COURS')) return 'status-encours';
    if (statut.includes('VALIDEE')) return 'status-validee';
    if (statut.includes('RECEPTIONNEE')) return 'status-receptionnee';
    if (statut.includes('ANNULEE')) return 'status-annulee';

    return 'status-default';
  }
}
