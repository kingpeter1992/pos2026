import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ServiceMouvementStockStore } from '../../service/mouvement/ServiceMouvementStockStore';
import { TransactionStockView } from '../../models/TransactionStockView';



@Component({
  selector: 'app-mouvements-stock-component',
  templateUrl: './mouvements-stock-component.html',
  styleUrl: './mouvements-stock-component.css',
  standalone: false
})
export class MouvementsStockComponent implements OnInit {
exportPdf() {
}
    readonly store = inject(ServiceMouvementStockStore);

  readonly displayedColumns: string[] = [
    'date',
    'produit',
    'depot',
    'typeTransaction',
    'quantite',
    'prixUnitaire',
    'fraisUnitaire',
    'coutUnitaireFinal',
    'stockAvant',
    'stockApres',
    'pmpAvant',
    'pmpApres',
    'referenceDocument',
    'sourceDocument',
    'libelle',
    'utilisateur'
  ];

  readonly loading = this.store.loading;
  readonly mouvements = this.store.mouvements;

  readonly search = signal('');
  readonly depotFilter = signal('');
  readonly typeFilter = signal('');
  readonly dateDebut = signal('');
  readonly dateFin = signal('');

  readonly filteredMouvements = computed(() =>
    this.store.filterMouvements(
      this.search(),
      this.depotFilter(),
      this.typeFilter(),
      this.dateDebut(),
      this.dateFin()
    )
  );

  readonly totalItems = computed(() => this.filteredMouvements().length);

  readonly totalEntrees = computed(() =>
    this.filteredMouvements().filter(m => this.isEntree(m.typeTransaction)).length
  );

  readonly totalSorties = computed(() =>
    this.filteredMouvements().filter(m => this.isSortie(m.typeTransaction)).length
  );

  readonly totalQuantiteEntree = computed(() =>
    this.filteredMouvements()
      .filter(m => this.isEntree(m.typeTransaction))
      .reduce((sum, m) => sum + Number(m.quantite ?? 0), 0)
  );

  readonly totalQuantiteSortie = computed(() =>
    this.filteredMouvements()
      .filter(m => this.isSortie(m.typeTransaction))
      .reduce((sum, m) => sum + Number(m.quantite ?? 0), 0)
  );

  readonly totalValeurEntree = computed(() =>
    this.filteredMouvements()
      .filter(m => this.isEntree(m.typeTransaction))
      .reduce((sum, m) => {
        const qte = Number(m.quantite ?? 0);
        const cout = Number(m.coutUnitaireFinal ?? 0);
        return sum + (qte * cout);
      }, 0)
  );

  readonly totalValeurSortie = computed(() =>
    this.filteredMouvements()
      .filter(m => this.isSortie(m.typeTransaction))
      .reduce((sum, m) => {
        const qte = Number(m.quantite ?? 0);
        const cout = Number(m.coutUnitaireFinal ?? 0);
        return sum + (qte * cout);
      }, 0)
  );

  readonly depots = computed(() =>
    [...new Set(this.mouvements().map(m => m.depotNom).filter(Boolean))]
  );

  readonly types = computed(() =>
    [...new Set(this.mouvements().map(m => m.typeTransaction).filter(Boolean))]
  );

  ngOnInit(): void {
    this.store.loadIfNeeded().subscribe();
  }

  refresh(): void {
    this.store.refresh().subscribe();
  }

  resetFilters(): void {
    this.search.set('');
    this.depotFilter.set('');
    this.typeFilter.set('');
    this.dateDebut.set('');
    this.dateFin.set('');
  }

  onSearchChange(value: string): void {
    this.search.set(value ?? '');
  }

  onDepotChange(value: string): void {
    this.depotFilter.set(value ?? '');
  }

  onTypeChange(value: string): void {
    this.typeFilter.set(value ?? '');
  }

  onDateDebutChange(value: string): void {
    this.dateDebut.set(value ?? '');
  }

  onDateFinChange(value: string): void {
    this.dateFin.set(value ?? '');
  }

  isEntree(type: string | null | undefined): boolean {
    return (type ?? '').toUpperCase().includes('ENTREE');
  }

  isSortie(type: string | null | undefined): boolean {
    return (type ?? '').toUpperCase().includes('SORTIE');
  }

  getBadgeClass(type: string | null | undefined): string {
    if (this.isEntree(type)) return 'badge-success';
    if (this.isSortie(type)) return 'badge-danger';
    return 'badge-info';
  }

  getTypeLabel(type: string | null | undefined): string {
    const value = (type ?? '').replace(/_/g, ' ').trim();
    return value || '-';
  }

  getVariationClass(type: string | null | undefined): string {
    if (this.isEntree(type)) return 'variation-up';
    if (this.isSortie(type)) return 'variation-down';
    return 'variation-neutral';
  }

  formatNumber(value: number | string | null | undefined, digits = 2): string {
    return Number(value ?? 0).toLocaleString('fr-FR', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
  }

  trackById = (_: number, row: TransactionStockView) => row.id;

  exportExcel(): void {
    const data = this.filteredMouvements().map(m => ({
      Date: m.dateTransaction,
      Produit: m.produitNom,
      Depot: m.depotNom,
      Type: this.getTypeLabel(m.typeTransaction),
      Quantite: m.quantite,
      PrixUnitaire: m.prixUnitaire,
      FraisUnitaire: m.fraisUnitaire,
      CoutUnitaireFinal: m.coutUnitaireFinal,
      StockAvant: m.stockAvant,
      StockApres: m.stockApres,
      PmpAvant: m.pmpAvant,
      PmpApres: m.pmpApres,
      Reference: m.referenceDocument,
      SourceDocument: m.sourceDocument,
      Libelle: m.libelle,
      Utilisateur: m.utilisateur
    }));

    import('xlsx').then(XLSX => {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'TransactionsStock');
      XLSX.writeFile(workbook, 'transactions-stock.xlsx');
    });
  }
}
