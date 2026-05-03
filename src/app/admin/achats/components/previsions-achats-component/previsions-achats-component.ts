import { AfterViewInit, Component, computed, effect, inject, OnInit, signal, ViewChild } from '@angular/core';
import { ServiceStockStore } from '../../../stock/service/stock-service/service-stock.store';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';


import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
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
    'tauxChangeUtilise',
    'pmpFc',
    'pmpUsd',
    'valeurStockFc',
    'valeurStockUsd',
    'joursSansVente',
    'tauxProvision',
    'montantProvisionFc',
    'montantProvisionUsd',
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
    this.configureFilterPredicate();
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    this.dataSource.sortingDataAccessor = (
      item: ProvisionStockResponse,
      property: string
    ): string | number => {
      switch (property) {
        case 'produitNom':
          return item.produitNom ?? '';

        case 'categorieNom':
          return item.categorieNom ?? '';

        case 'codeBarres':
          return item.codeBarres ?? '';

        case 'quantiteDisponible':
          return Number(item.quantiteDisponible ?? 0);

        case 'tauxChangeUtilise':
          return Number(item.tauxChangeUtilise ?? 0);

        case 'pmpFc':
          return Number(item.pmpFc ?? 0);

        case 'pmpUsd':
          return Number(item.pmpUsd ?? 0);

        case 'valeurStockFc':
          return Number(item.valeurStockFc ?? 0);

        case 'valeurStockUsd':
          return Number(item.valeurStockUsd ?? 0);

        case 'joursSansVente':
          return Number(item.joursSansVente ?? 0);

        case 'tauxProvision':
          return Number(item.tauxProvision ?? 0);

        case 'montantProvisionFc':
          return Number(item.montantProvisionFc ?? 0);

        case 'montantProvisionUsd':
          return Number(item.montantProvisionUsd ?? 0);

        case 'niveauRisque':
          return item.niveauRisque ?? '';

        default:
          return '';
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
    this.dataSource.filterPredicate = (
      item: ProvisionStockResponse,
      filter: string
    ): boolean => {
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

  get totalValeurFiltreeFc(): number {
    return this.filteredRows.reduce(
      (sum, item) => sum + Number(item.valeurStockFc ?? 0),
      0
    );
  }

  get totalValeurFiltreeUsd(): number {
    return this.filteredRows.reduce(
      (sum, item) => sum + Number(item.valeurStockUsd ?? 0),
      0
    );
  }

  get totalProvisionFiltreeFc(): number {
    return this.filteredRows.reduce(
      (sum, item) => sum + Number(item.montantProvisionFc ?? 0),
      0
    );
  }

  get totalProvisionFiltreeUsd(): number {
    return this.filteredRows.reduce(
      (sum, item) => sum + Number(item.montantProvisionUsd ?? 0),
      0
    );
  }

  get totalProvisionFiltree(): number {
    return this.totalProvisionFiltreeFc;
  }

async exportExcel(): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Provision Stock');

  worksheet.mergeCells('A1:N1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'RAPPORT PROVISION STOCK';
  titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1F4E78' }
  };

  worksheet.addRow([]);

  worksheet.addRow([
    'Produit',
    'Catégorie',
    'Code-barres',
    'Qté',
    'Taux stock',
    'PMP FC',
    'PMP USD',
    'Valeur FC',
    'Valeur USD',
    'Jours sans vente',
    'Taux provision',
    'Provision FC',
    'Provision USD',
    'Risque'
  ]);

  const headerRow = worksheet.getRow(3);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 24;

  headerRow.eachCell(cell => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF305496' }
    };
    cell.border = this.excelBorder();
  });

  this.filteredRows.forEach(item => {
    worksheet.addRow([
      item.produitNom ?? '',
      item.categorieNom ?? '',
      item.codeBarres ?? '',
      Number(item.quantiteDisponible ?? 0),
      Number(item.tauxChangeUtilise ?? 0),
      Number(item.pmpFc ?? 0),
      Number(item.pmpUsd ?? 0),
      Number(item.valeurStockFc ?? 0),
      Number(item.valeurStockUsd ?? 0),
      Number(item.joursSansVente ?? 0),
      Number(item.tauxProvision ?? 0),
      Number(item.montantProvisionFc ?? 0),
      Number(item.montantProvisionUsd ?? 0),
      item.niveauRisque ?? ''
    ]);
  });

  worksheet.addRow([]);

  const totalRow = worksheet.addRow([
    'TOTAL',
    '',
    '',
    '',
    '',
    '',
    '',
    this.totalValeurFiltreeFc,
    this.totalValeurFiltreeUsd,
    '',
    '',
    this.totalProvisionFiltreeFc,
    this.totalProvisionFiltreeUsd,
    ''
  ]);

  totalRow.font = { bold: true };
  totalRow.eachCell(cell => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9EAF7' }
    };
    cell.border = this.excelBorder();
  });

  worksheet.columns = [
    { width: 35 },
    { width: 22 },
    { width: 20 },
    { width: 12 },
    { width: 14 },
    { width: 16 },
    { width: 16 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 16 },
    { width: 18 },
    { width: 18 },
    { width: 14 }
  ];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 4) {
      row.eachCell((cell, colNumber) => {
        cell.border = this.excelBorder();
        cell.alignment = {
          vertical: 'middle',
          horizontal: colNumber >= 4 && colNumber <= 13 ? 'right' : 'left'
        };

        if ([4, 5, 6, 7, 8, 9, 11, 12, 13].includes(colNumber)) {
          cell.numFmt = '#,##0.00';
        }

        if (colNumber === 10) {
          cell.numFmt = '0';
        }

        if (colNumber === 11) {
          cell.numFmt = '0%';
        }
      });
    }
  });

  worksheet.autoFilter = {
    from: 'A3',
    to: 'N3'
  };

  worksheet.views = [
    { state: 'frozen', ySplit: 3 }
  ];

  const buffer = await workbook.xlsx.writeBuffer();

  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }),
    'provision-stock.xlsx'
  );
}

exportPdf(): void {
  const doc = new jsPDF('landscape', 'mm', 'a4');

  doc.setFontSize(16);
  doc.text('Rapport Provision Stock', 14, 15);

  doc.setFontSize(9);
  doc.text(`Valeur stock FC : ${this.formatPdfNumber(this.totalValeurFiltreeFc)} FC`, 14, 25);
  doc.text(`Valeur stock USD : ${this.formatPdfNumber(this.totalValeurFiltreeUsd)} USD`, 80, 25);
  doc.text(`Provision FC : ${this.formatPdfNumber(this.totalProvisionFiltreeFc)} FC`, 150, 25);
  doc.text(`Provision USD : ${this.formatPdfNumber(this.totalProvisionFiltreeUsd)} USD`, 215, 25);

  autoTable(doc, {
    startY: 35,
    head: [[
      'Produit',
      'Categorie',
      'Code-barres',
      'Qte',
      'Taux',
      'PMP FC',
      'PMP USD',
      'Valeur FC',
      'Valeur USD',
      'Jours',
      'Taux Prov.',
      'Prov. FC',
      'Prov. USD',
      'Risque'
    ]],
    body: this.filteredRows.map(item => [
      this.cleanPdfText(item.produitNom),
      this.cleanPdfText(item.categorieNom),
      this.cleanPdfText(item.codeBarres),
      this.formatPdfNumber(item.quantiteDisponible, 3),
      this.formatPdfNumber(item.tauxChangeUtilise, 2),
      this.formatPdfNumber(item.pmpFc, 2),
      this.formatPdfNumber(item.pmpUsd, 2),
      this.formatPdfNumber(item.valeurStockFc, 2),
      this.formatPdfNumber(item.valeurStockUsd, 2),
      this.formatPdfNumber(item.joursSansVente, 0),
      this.formatPercent(item.tauxProvision),
      this.formatPdfNumber(item.montantProvisionFc, 2),
      this.formatPdfNumber(item.montantProvisionUsd, 2),
      this.cleanPdfText(item.niveauRisque)
    ]),
    styles: {
      fontSize: 6,
      cellPadding: 1.6,
      overflow: 'linebreak'
    },
    headStyles: {
      fontSize: 6,
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 36 },
      1: { cellWidth: 22 },
      2: { cellWidth: 24 },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right' },
      8: { halign: 'right' },
      9: { halign: 'right' },
      10: { halign: 'right' },
      11: { halign: 'right' },
      12: { halign: 'right' },
      13: { halign: 'center' }
    }
  });

  doc.save('provision-stock.pdf');
}
  formatPercent(value: number | null | undefined): string {
    return `${(Number(value ?? 0) * 100).toFixed(0)} %`;
  }

  riskClass(risque: string | null | undefined): string {
    switch (risque) {
      case 'TOTAL':
        return 'risk-total';
      case 'ELEVE':
        return 'risk-eleve';
      case 'MOYEN':
        return 'risk-moyen';
      default:
        return 'risk-faible';
    }
  }








  formatPdfNumber(value: number | null | undefined, digits = 2): string {
  const n = Number(value ?? 0);

  return n
    .toFixed(digits)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

formatMoney(value: number | null | undefined, digits = 2): string {
  return this.formatPdfNumber(value, digits);
}

cleanPdfText(value: string | null | undefined): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();
}

excelBorder(): Partial<ExcelJS.Borders> {
  return {
    top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
  };
}
}
