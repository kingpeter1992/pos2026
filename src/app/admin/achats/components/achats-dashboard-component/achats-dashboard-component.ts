import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommandeAchatStore } from '../../service/achat/CommandeAchatStore';

export interface CommandeDashboardItemDto {
  id: number;
  refCommande?: string;
  reference?: string;
  fournisseurNom?: string;
  dateCommande?: string;
  datePrevue?: string;
  statut?: string;
  montantTotal?: number;
  devise?: string;
  quantiteTotale?: number;
  quantiteRecue?: number;
  progression?: number;
  joursRetard?: number;
}

export interface FournisseurDashboardDto {
  fournisseurId?: number;
  fournisseurNom?: string;
  totalCommandes: number;
  montantTotal: number;
}

export interface CommandeDashboardResponse {
  totalCommandes: number;
  totalBrouillon: number;
  totalEnCours: number;
  totalPartielLivre: number;
  totalLivre: number;
  totalAnnule: number;
  totalRetard: number;

  montantTotal: number;
  montantMoyen: number;

  quantiteTotaleCommandee: number;
  quantiteTotaleRecue: number;
  tauxReceptionGlobal: number;

  commandesRecentes: CommandeDashboardItemDto[];
  commandesEnRetard: CommandeDashboardItemDto[];
  topFournisseurs: FournisseurDashboardDto[];
  alertes: string[];
}

@Component({
  selector: 'app-achats-dashboard-component',
  templateUrl: './achats-dashboard-component.html',
  styleUrl: './achats-dashboard-component.css',
  standalone: false
})
export class AchatsDashboardComponent implements  OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly storeAchat = inject(CommandeAchatStore);

  private readonly subscriptions = new Subscription();

  readonly loading = signal<boolean>(false);
  readonly dashboard = signal<CommandeDashboardResponse | null>(null);

  readonly search = signal<string>('');
  readonly statutFilter = signal<string>('TOUS');

  ngOnInit(): void {
    this.bindStore();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private bindStore(): void {
    if (this.storeAchat.dashboard$) {
      this.subscriptions.add(
        this.storeAchat.dashboard$.subscribe((data: CommandeDashboardResponse | null) => {
          this.dashboard.set(data);
          console.log('data', data)
        })
      );
    }

    if (this.storeAchat.loading$) {
      this.subscriptions.add(
        this.storeAchat.loading$.subscribe((isLoading: boolean) => {
          this.loading.set(!!isLoading);
        })
      );
    }
  }

private loadData(): void {
  if (typeof this.storeAchat.getDashboard === 'function') {
    this.storeAchat.getDashboard();
    console.log('Chargement du dashboard via getDashboard()', this.storeAchat);
    return;
  }

  if (typeof this.storeAchat.loadDashboard === 'function') {
    this.storeAchat.loadDashboard();
    return;
  }

  if (typeof this.storeAchat.refreshDashboard === 'function') {
    this.storeAchat.refreshDashboard();
  }
}

  readonly allCommandes = computed<CommandeDashboardItemDto[]>(() => {
    const data = this.dashboard();
    return data?.commandesRecentes ?? [];
  });

  readonly filteredCommandes = computed<CommandeDashboardItemDto[]>(() => {
    const keyword = this.search().trim().toLowerCase();
    const statut = this.statutFilter().toUpperCase();

    const commandes = this.dashboard()?.commandesRecentes ?? [];

    return commandes.filter(cmd => {
      const matchesKeyword =
        !keyword ||
        (cmd.refCommande || cmd.reference || '').toLowerCase().includes(keyword) ||
        (cmd.fournisseurNom || '').toLowerCase().includes(keyword);

      const matchesStatut =
        statut === 'TOUS' ||
        (cmd.statut || '').toUpperCase() === statut;

      return matchesKeyword && matchesStatut;
    });
  });

  readonly totalCommandes = computed(() => this.dashboard()?.totalCommandes ?? 0);
  readonly totalBrouillon = computed(() => this.dashboard()?.totalBrouillon ?? 0);
  readonly totalEnCours = computed(() => this.dashboard()?.totalEnCours ?? 0);
  readonly totalPartielLivre = computed(() => this.dashboard()?.totalPartielLivre ?? 0);
  readonly totalLivre = computed(() => this.dashboard()?.totalLivre ?? 0);
  readonly totalAnnule = computed(() => this.dashboard()?.totalAnnule ?? 0);
  readonly totalRetard = computed(() => this.dashboard()?.totalRetard ?? 0);

  readonly montantTotal = computed(() => Number(this.dashboard()?.montantTotal ?? 0));
  readonly montantMoyenCommande = computed(() => Number(this.dashboard()?.montantMoyen ?? 0));
  readonly quantiteTotaleCommandee = computed(() => Number(this.dashboard()?.quantiteTotaleCommandee ?? 0));
  readonly quantiteTotaleRecue = computed(() => Number(this.dashboard()?.quantiteTotaleRecue ?? 0));
  readonly tauxReceptionGlobal = computed(() => Number(this.dashboard()?.tauxReceptionGlobal ?? 0));

  readonly commandesRecentes = computed<CommandeDashboardItemDto[]>(() => {
    const list = this.dashboard()?.commandesRecentes ?? [];
    const keyword = this.search().trim().toLowerCase();
    const statut = this.statutFilter().toUpperCase();

    return list.filter(item => {
      const matchesKeyword =
        !keyword ||
        (item.refCommande || item.reference || '').toLowerCase().includes(keyword) ||
        (item.fournisseurNom || '').toLowerCase().includes(keyword);

      const matchesStatut =
        statut === 'TOUS' ||
        (item.statut || '').toUpperCase() === statut;

      return matchesKeyword && matchesStatut;
    });
  });

  readonly commandesEnRetard = computed<CommandeDashboardItemDto[]>(() => {
    return this.dashboard()?.commandesEnRetard ?? [];
  });

  readonly topFournisseurs = computed<FournisseurDashboardDto[]>(() => {
    return this.dashboard()?.topFournisseurs ?? [];
  });

  readonly alertes = computed<string[]>(() => {
    return this.dashboard()?.alertes ?? [];
  });

  refresh(): void {
    this.loadData();
  }

  clearFilters(): void {
    this.search.set('');
    this.statutFilter.set('TOUS');
  }

  onSearch(value: string): void {
    this.search.set(value || '');
  }

  onChangeStatut(value: string): void {
    this.statutFilter.set(value || 'TOUS');
  }

  openCommande(item: CommandeDashboardItemDto): void {
    if (!item?.id) return;
    this.router.navigate(['/admin/achats/commandes/details', item.id]);
  }

  createCommande(): void {
    this.router.navigate(['/admin/achats/commandes']);
  }

  exportPdf(): void {
    console.log('Exporter PDF dashboard commande');
  }

  exportExcel(): void {
    console.log('Exporter Excel dashboard commande');
  }

  getProgress(item: CommandeDashboardItemDto): number {
    if (item.progression != null) {
      return Math.min(Number(item.progression || 0), 100);
    }

    const total = Number(item.quantiteTotale || 0);
    const recu = Number(item.quantiteRecue || 0);

    if (!total) return 0;
    return Math.min((recu / total) * 100, 100);
  }

  isLate(item: CommandeDashboardItemDto): boolean {
    return Number(item.joursRetard || 0) > 0;
  }

  daysLate(item: CommandeDashboardItemDto): number {
    return Number(item.joursRetard || 0);
  }

  getStatutClass(statut?: string): string {
    const s = (statut || '').toUpperCase();

    if (s === 'BROUILLON') return 'badge draft';
    if (s === 'EN_COURS' || s === 'VALIDEE') return 'badge progress';
    if (s.includes('PARTIEL')) return 'badge partial';
    if (s === 'LIVREE' || s === 'CLOTUREE') return 'badge success';
    if (s === 'ANNULEE' || s === 'ANNULE') return 'badge danger';

    return 'badge neutral';
  }

  getStatutLabel(statut?: string): string {
    const s = (statut || '').toUpperCase();

    switch (s) {
      case 'BROUILLON': return 'Brouillon';
      case 'EN_COURS': return 'En cours';
      case 'VALIDEE': return 'Validée';
      case 'PARTIELLEMENT_LIVREE': return 'Partiellement livrée';
      case 'PARTIELLE': return 'Partiellement livrée';
      case 'LIVREE': return 'Livrée';
      case 'CLOTUREE': return 'Clôturée';
      case 'ANNULEE': return 'Annulée';
      case 'ANNULE': return 'Annulée';
      default: return statut || '-';
    }
  }

  getCommandeRef(item: CommandeDashboardItemDto): string {
    return item.refCommande || item.reference || `CMD-${item.id}`;
  }

  formatMoney(value: number, devise: string = 'USD'): string {
    const formatted = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value || 0));

    return `${formatted} ${devise}`;
  }

  formatNumber(value: number, digits: number = 0): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(Number(value || 0));
  }

  trackByCommande(index: number, item: CommandeDashboardItemDto): number {
    return item.id;
  }

  trackByText(index: number, item: string): string {
    return item;
  }
}
