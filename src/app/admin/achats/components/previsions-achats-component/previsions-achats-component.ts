import { AfterViewInit, Component, computed, effect, inject, OnInit, signal, ViewChild } from '@angular/core';
import { ServiceStockStore } from '../../../stock/service/stock-service/service-stock.store';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';


import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { finalize } from 'rxjs';
import { ProvisionStockResponse } from '../../../stock/models/stock-produit.model';

type NiveauRisque = 'TOUS' | 'FAIBLE' | 'MOYEN' | 'ELEVE' | 'TOTAL';


@Component({
  selector: 'app-previsions-achats-component',
  templateUrl: './previsions-achats-component.html',
  styleUrl: './previsions-achats-component.css',
  standalone :false
})
export class PrevisionsAchatsComponent implements  OnInit, AfterViewInit {
  readonly store = inject(ServiceStockStore);

  displayedColumns: string[] = [
    'produitNom',
    'categorieNom',
    'codeBarres',
    'quantiteDisponible',
    'pmp',
    'valeurStock',
    'joursSansVente',
    'tauxProvision',
    'montantProvision',
    'niveauRisque'
  ];

  dataSource = new MatTableDataSource<ProvisionStockResponse>([]);

  search = '';
  selectedCategorie = '';
  selectedRisque: NiveauRisque = 'TOUS';

  loadingTable = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.loadData();
    this.configureFilterPredicate();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSource.sortingDataAccessor = (item: ProvisionStockResponse, property: string): string | number => {
      switch (property) {
        case 'produitNom': return item.produitNom ?? '';
        case 'categorieNom': return item.categorieNom ?? '';
        case 'codeBarres': return item.codeBarres ?? '';
        case 'quantiteDisponible': return Number(item.quantiteDisponible ?? 0);
        case 'pmp': return Number(item.pmp ?? 0);
        case 'valeurStock': return Number(item.valeurStock ?? 0);
        case 'joursSansVente': return Number(item.joursSansVente ?? 0);
        case 'tauxProvision': return Number(item.tauxProvision ?? 0);
        case 'montantProvision': return Number(item.montantProvision ?? 0);
        case 'niveauRisque': return item.niveauRisque ?? '';
        default: return '';
      }
    };
  }

  loadData(): void {
    this.loadingTable = true;
    this.store.loadProvisionIfNeeded()
      .pipe(finalize(() => this.loadingTable = false))
      .subscribe({
        next: (res) => {
          this.dataSource.data = res?.lignes ?? [];
          this.applyFilter();
        },
        error: (err) => console.error(err)
      });
  }

  refresh(): void {
    this.loadingTable = true;
    this.store.refreshProvision()
      .pipe(finalize(() => this.loadingTable = false))
      .subscribe({
        next: (res) => {
          this.dataSource.data = res?.lignes ?? [];
          this.applyFilter();
        },
        error: (err) => console.error(err)
      });
  }

  configureFilterPredicate(): void {
    this.dataSource.filterPredicate = (item: ProvisionStockResponse, filter: string): boolean => {
      const f = JSON.parse(filter);

      const term = (f.search ?? '').toLowerCase();
      const categorie = (f.categorie ?? '').toLowerCase();
      const risque = (f.risque ?? 'TOUS').toUpperCase();

      const matchSearch =
        !term ||
        (item.produitNom ?? '').toLowerCase().includes(term) ||
        (item.codeBarres ?? '').toLowerCase().includes(term) ||
        (item.categorieNom ?? '').toLowerCase().includes(term);

      const matchCategorie =
        !categorie || (item.categorieNom ?? '').toLowerCase() === categorie;

      const matchRisque =
        risque === 'TOUS' || item.niveauRisque === risque;

      return matchSearch && matchCategorie && matchRisque;
    };
  }

  applyFilter(): void {
    this.dataSource.filter = JSON.stringify({
      search: this.search,
      categorie: this.selectedCategorie,
      risque: this.selectedRisque
    });

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  resetFilters(): void {
    this.search = '';
    this.selectedCategorie = '';
    this.selectedRisque = 'TOUS';
    this.applyFilter();
  }

  get filteredRows(): ProvisionStockResponse[] {
    return this.dataSource.filteredData ?? [];
  }

  get totalValeurFiltree(): number {
    return this.filteredRows.reduce((sum, item) => sum + Number(item.valeurStock ?? 0), 0);
  }

  get totalProvisionFiltree(): number {
    return this.filteredRows.reduce((sum, item) => sum + Number(item.montantProvision ?? 0), 0);
  }

  exportExcel(): void {
    const rows = this.filteredRows.map(item => ({
      Produit: item.produitNom,
      'Code-barres': item.codeBarres,
      Catégorie: item.categorieNom,
      'Qté disponible': item.quantiteDisponible,
      PMP: item.pmp,
      'Valeur stock': item.valeurStock,
      'Jours sans vente': item.joursSansVente,
      'Taux provision': item.tauxProvision,
      'Montant provision': item.montantProvision,
      'Niveau risque': item.niveauRisque
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Provision Stock');
    XLSX.writeFile(workbook, 'provision-stock.xlsx');
  }

  exportPdf(): void {
    const doc = new jsPDF('landscape');

    doc.setFontSize(16);
    doc.text('Rapport Provision Stock', 14, 15);

    doc.setFontSize(10);
    doc.text(`Valeur stock filtrée : ${this.totalValeurFiltree.toFixed(2)} USD`, 14, 24);
    doc.text(`Provision filtrée : ${this.totalProvisionFiltree.toFixed(2)} USD`, 110, 24);

    autoTable(doc, {
      startY: 30,
      head: [[
        'Produit',
        'Catégorie',
        'Code-barres',
        'Qté',
        'PMP',
        'Valeur',
        'Jours sans vente',
        'Taux',
        'Provision',
        'Risque'
      ]],
      body: this.filteredRows.map(item => [
        item.produitNom ?? '',
        item.categorieNom ?? '',
        item.codeBarres ?? '',
        Number(item.quantiteDisponible ?? 0).toFixed(2),
        Number(item.pmp ?? 0).toFixed(2),
        Number(item.valeurStock ?? 0).toFixed(2),
        Number(item.joursSansVente ?? 0),
        `${(Number(item.tauxProvision ?? 0) * 100).toFixed(0)}%`,
        Number(item.montantProvision ?? 0).toFixed(2),
        item.niveauRisque ?? ''
      ])
    });

    doc.save('provision-stock.pdf');
  }

  formatPercent(value: number | null | undefined): string {
    return `${(Number(value ?? 0) * 100).toFixed(0)} %`;
  }

  riskClass(risque: string | null | undefined): string {
    switch (risque) {
      case 'TOTAL': return 'risk-total';
      case 'ELEVE': return 'risk-eleve';
      case 'MOYEN': return 'risk-moyen';
      default: return 'risk-faible';
    }
  }
}
