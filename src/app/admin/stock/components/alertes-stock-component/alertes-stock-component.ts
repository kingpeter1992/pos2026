import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { StatutPeremption } from '../../models/statut-peremption.enum';
import { PeremptionStore } from '../../service/peremption-service/peremption.store';

@Component({
  selector: 'app-alertes-stock-component',
  templateUrl: './alertes-stock-component.html',
  styleUrl: './alertes-stock-component.css',
  standalone:false
})
export class AlertesStockComponent implements OnInit {
  readonly store = inject(PeremptionStore);

  // filtres UI
  readonly recherche = signal('');
  readonly filtreProduit = signal('');
  readonly filtreStatut = signal('');
  readonly uniquementDisponibles = signal(true);

  readonly statuts: StatutPeremption[] = [
    StatutPeremption.VALIDE,
    StatutPeremption.PROCHE_EXPIRATION,
    StatutPeremption.ALERTE_170_JOURS
    , StatutPeremption.ALERTE_350_JOURS,
    StatutPeremption.ALERTE_30_JOURS,
    StatutPeremption.ALERTE_7_JOURS,
    StatutPeremption.EXPIRE_AUJOURD_HUI,
    StatutPeremption.PERIME
  ];

  readonly displayedColumns = [
    'produitNom',
    'depotNom',
    'quantiteDisponible',
    'dateEntree',
    'datePeremption',
    'joursRestants',
    'statutPeremption',
    'coutUnitaireFinal',
    'referenceDocument'
  ];

  // données exposées au template
  readonly dashboard = computed(() => this.store.dashboard());
  readonly lots = computed(() => this.store.filteredLots());
  readonly alertes = computed(() => this.store.filteredAlertes());

  readonly loading = computed(() => this.store.loading());
  readonly loadingLots = computed(() => this.store.loadingLots());
  readonly loadingAlertes = computed(() => this.store.loadingAlertes());
  readonly loadingDashboard = computed(() => this.store.loadingDashboard());
  readonly recalculLoading = computed(() => this.store.recalculLoading());

  readonly totalLots = computed(() => this.store.totalLots());
  readonly totalLotsGlobal = computed(() => this.store.totalLotsGlobal());
  readonly totalAlertes = computed(() => this.store.totalAlertes());
  readonly totalAlertesGlobal = computed(() => this.store.totalAlertesGlobal());
  readonly totalLotsPerimes = computed(() => this.store.totalLotsPerimes());
  readonly totalLotsValides = computed(() => this.store.totalLotsValides());
  readonly totalLotsAlerte = computed(() => this.store.totalLotsAlerte());

  readonly alertesAffichees = computed(() => this.alertes().slice(0, 5));

  ngOnInit(): void {
    this.store.loadAll();
  }

  refreshAll(): void {
    this.store.refreshAll();
  }

  recalculerStatuts(): void {
    this.store.recalculer();
  }

  appliquerFiltres(): void {
    this.store.setLotFilters({
      recherche: this.recherche(),
      produit: this.filtreProduit(),
      statut: this.filtreStatut(),
      uniquementDisponibles: this.uniquementDisponibles()
    });
  }

  resetFiltres(): void {
    this.recherche.set('');
    this.filtreProduit.set('');
    this.filtreStatut.set('');
    this.uniquementDisponibles.set(true);
    this.store.resetLotFilters();
  }

  afficherTousLesLots(): void {
    this.store.restoreAllLots();
  }

  afficherLotsEnAlerte(): void {
    this.store.showOnlyLotsEnAlerte();
  }

  afficherLotsPerimes(): void {
    this.store.showOnlyLotsPerimes();
  }

  trierParDatePeremptionAsc(): void {
    this.store.sortLots('datePeremption', 'asc');
  }

  trierParDatePeremptionDesc(): void {
    this.store.sortLots('datePeremption', 'desc');
  }

  trierParProduitAsc(): void {
    this.store.sortLots('produitNom', 'asc');
  }

  trierParQuantiteDesc(): void {
    this.store.sortLots('quantiteDisponible', 'desc');
  }

  trierParJoursRestantsAsc(): void {
    this.store.sortLots('joursRestants', 'asc');
  }

  getStatutLabel(statut?: string | null): string {
    switch (statut) {
      case 'PERIME':
        return 'Périmé';
      case 'EXPIRE_AUJOURD_HUI':
        return 'Expire aujourd’hui';
      case 'ALERTE_7_JOURS':
        return 'Alerte 7 jours';
      case 'ALERTE_30_JOURS':
        return 'Alerte 30 jours';
      case 'ALERTE_170_JOURS':
        return 'Alerte 170 jours';
      case 'ALERTE_350_JOURS':
        return 'Alerte 350 jours';
      case 'PROCHE_EXPIRATION':
        return 'Proche expiration';
      default:
        return 'Valide';
    }
  }

  getStatutClass(statut?: string | null): string {
    switch (statut) {
      case 'PERIME':
        return 'status-perime';
      case 'EXPIRE_AUJOURD_HUI':
        return 'status-expire-aujourdhui';
      case 'ALERTE_7_JOURS':
        return 'status-7j';
      case 'ALERTE_30_JOURS':
        return 'status-30j';
      case 'ALERTE_170_JOURS':
        return 'status-170j';
      case 'ALERTE_350_JOURS':
        return 'status-350j';
      case 'PROCHE_EXPIRATION':
        return 'status-proche';
      default:
        return 'status-valide';
    }
  }

  formatJoursRestants(jours?: number | null): string {
    if (jours == null) return '-';
    if (jours < 0) return `Périmé depuis ${Math.abs(jours)} jour(s)`;
    if (jours === 0) return `Expire aujourd’hui`;
    return `${jours} jour(s) restant(s)`;
  }

  onRechercheChange(value: string): void {
    this.recherche.set(value ?? '');
    this.appliquerFiltres();
  }

  onProduitChange(value: string): void {
    this.filtreProduit.set(value ?? '');
    this.appliquerFiltres();
  }

  onStatutChange(value: string): void {
    this.filtreStatut.set(value ?? '');
    this.appliquerFiltres();
  }

  onDisponibiliteChange(value: boolean): void {
    this.uniquementDisponibles.set(!!value);
    this.appliquerFiltres();
  }
}
