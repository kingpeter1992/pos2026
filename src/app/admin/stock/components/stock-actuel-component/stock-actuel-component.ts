import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ServiceStockStore } from '../../service/stock-service/service-stock.store';
import { StockProduitView } from '../../models/stock-produit.model';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-stock-actuel-component',
  templateUrl: './stock-actuel-component.html',
  styleUrl: './stock-actuel-component.css',
  standalone: false
})
export class StockActuelComponent implements OnInit {
  private readonly stockStore = inject(ServiceStockStore);

  readonly loading = this.stockStore.loading;
  readonly stocks = this.stockStore.stocks;
  readonly depots = this.stockStore.depots;

  readonly search = signal<string>('');
  readonly depotFilter = signal<string>('');
  readonly statutFilter = signal<string>('');

  readonly filteredStocks = computed(() =>
    this.stockStore.filterStocks(
      this.search(),
      this.depotFilter(),
      this.statutFilter()
    )
  );

  readonly totalProduits = computed(() => this.filteredStocks().length);

  readonly totalQuantite = computed(() =>
    this.filteredStocks().reduce((sum, row) => sum + this.n(row.quantiteDisponible), 0)
  );

  readonly totalRevientFc = computed(() =>
    this.filteredStocks().reduce(
      (sum, row) => sum + this.n(row.valeurStockFc ?? row.valeurStock),
      0
    )
  );

  readonly totalRevientUsd = computed(() =>
    this.filteredStocks().reduce((sum, row) => sum + this.n(row.valeurStockUsd), 0)
  );

  readonly totalMargeFc = computed(() =>
    this.filteredStocks().reduce((sum, row) => sum + this.getMargeTotaleFc(row), 0)
  );

  readonly totalMargeUsd = computed(() =>
    this.filteredStocks().reduce((sum, row) => sum + this.getMargeTotaleUsd(row), 0)
  );

  readonly totalValeurVenteFc = computed(() =>
    this.filteredStocks().reduce((sum, row) => sum + this.getValeurVentePotentielleFc(row), 0)
  );

  readonly totalValeurVenteUsd = computed(() =>
    this.filteredStocks().reduce((sum, row) => sum + this.getValeurVentePotentielleUsd(row), 0)
  );

  readonly totalRuptures = computed(() =>
    this.filteredStocks().filter(row => this.getResolvedStatut(row) === 'RUPTURE').length
  );

  readonly totalAlertesRupture = computed(() =>
    this.filteredStocks().filter(row => this.getResolvedStatut(row) === 'ALERTE_RUPTURE').length
  );

  readonly totalSurplus = computed(() =>
    this.filteredStocks().filter(row => this.getResolvedStatut(row) === 'SURPLUS').length
  );

  readonly totalNormaux = computed(() =>
    this.filteredStocks().filter(row => this.getResolvedStatut(row) === 'NORMAL').length
  );

  ngOnInit(): void {
    this.stockStore.loadIfNeeded().subscribe();
  }

  refresh(): void {
    this.stockStore.refresh().subscribe();
  }

  onSearchChange(value: string): void {
    this.search.set((value ?? '').trim());
  }

  onDepotChange(value: string): void {
    this.depotFilter.set(value ?? '');
  }

  onStatutChange(value: string): void {
    this.statutFilter.set(value ?? '');
  }

  n(value: number | string | null | undefined): number {
    return Number(value ?? 0);
  }

  toUsd(valueFc: number | string | null | undefined, taux: number | string | null | undefined): number {
    const fc = this.n(valueFc);
    const t = this.n(taux);
    return t > 0 ? fc / t : 0;
  }

  getPmpFc(row: StockProduitView): number {
    return this.n(row.pmpFc ?? row.pmp);
  }

  getPmpUsd(row: StockProduitView): number {
    return this.n(row.pmpUsd);
  }

  getValeurStockFc(row: StockProduitView): number {
    return this.n(row.valeurStockFc ?? row.valeurStock);
  }

  getValeurStockUsd(row: StockProduitView): number {
    return this.n(row.valeurStockUsd);
  }

  getMargeUnitaireFc(row: StockProduitView): number {
    return this.n(row.margeUnitaire);
  }

  getMargeUnitaireUsd(row: StockProduitView): number {
    return this.toUsd(row.margeUnitaire, row.tauxChangeUtilise);
  }

  getMargeTotaleFc(row: StockProduitView): number {
    return this.n(row.margeTotaleStock);
  }

  getMargeTotaleUsd(row: StockProduitView): number {
    return this.toUsd(row.margeTotaleStock, row.tauxChangeUtilise);
  }

  getPrixVenteUnitaireFc(row: StockProduitView): number {
    return this.n(row.prixVenteUnitaire);
  }

  getPrixVenteUnitaireUsd(row: StockProduitView): number {
    return this.toUsd(row.prixVenteUnitaire, row.tauxChangeUtilise);
  }

  getValeurVentePotentielleFc(row: StockProduitView): number {
    return this.n(row.quantiteDisponible) * this.n(row.prixVenteUnitaire);
  }

  getValeurVentePotentielleUsd(row: StockProduitView): number {
    return this.toUsd(this.getValeurVentePotentielleFc(row), row.tauxChangeUtilise);
  }

  getResolvedStatut(row: StockProduitView): 'RUPTURE' | 'ALERTE_RUPTURE' | 'SURPLUS' | 'NORMAL' {
    return this.stockStore.resolveStatut(row);
  }

  getBadgeClass(statut: string): string {
    switch (statut) {
      case 'RUPTURE':
        return 'badge-danger';
      case 'ALERTE_RUPTURE':
        return 'badge-warning';
      case 'SURPLUS':
        return 'badge-info';
      default:
        return 'badge-success';
    }
  }

  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'RUPTURE':
        return 'Rupture';
      case 'ALERTE_RUPTURE':
        return 'Sous stock';
      case 'SURPLUS':
        return 'Surstock';
      default:
        return 'Normal';
    }
  }

  async exportExcel(): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Stock Actuel');

    worksheet.mergeCells('A1:V1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'RAPPORT STOCK ACTUEL';
    titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };

    worksheet.addRow([]);

    worksheet.addRow([
      'Produit',
      'Code-barres',
      'Catégorie',
      'Dépôt',
      'Emplacement',
      'Qté disponible',
      'Stock min',
      'Stock max',
      'Taux utilisé',
      'PMP FC',
      'PMP USD',
      'Valeur stock FC',
      'Valeur stock USD',
      'Marge %',
      'Marge unitaire FC',
      'Marge unitaire USD',
      'Marge stock FC',
      'Marge stock USD',
      'PV unitaire FC',
      'PV unitaire USD',
      'Valeur vente FC',
      'Valeur vente USD',
      'Statut'
    ]);

    const headerRow = worksheet.getRow(3);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 24;

    headerRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF305496' } };
      cell.border = this.excelBorder();
    });

    this.filteredStocks().forEach(row => {
      worksheet.addRow([
        row.nomProduit ?? '',
        row.codeBarre ?? '',
        row.categorie ?? '',
        row.nomDepot ?? '',
        row.locatorCode ?? '',
        this.n(row.quantiteDisponible),
        this.n(row.stockMinimum),
        this.n(row.stockMaximum),
        this.n(row.tauxChangeUtilise),
        this.getPmpFc(row),
        this.getPmpUsd(row),
        this.getValeurStockFc(row),
        this.getValeurStockUsd(row),
        this.n(row.tauxMarge),
        this.getMargeUnitaireFc(row),
        this.getMargeUnitaireUsd(row),
        this.getMargeTotaleFc(row),
        this.getMargeTotaleUsd(row),
        this.getPrixVenteUnitaireFc(row),
        this.getPrixVenteUnitaireUsd(row),
        this.getValeurVentePotentielleFc(row),
        this.getValeurVentePotentielleUsd(row),
        this.getStatutLabel(this.getResolvedStatut(row))
      ]);
    });

    worksheet.addRow([]);

    const totalRow = worksheet.addRow([
      'TOTAL',
      '',
      '',
      '',
      '',
      this.totalQuantite(),
      '',
      '',
      '',
      '',
      '',
      this.totalRevientFc(),
      this.totalRevientUsd(),
      '',
      '',
      '',
      this.totalMargeFc(),
      this.totalMargeUsd(),
      '',
      '',
      this.totalValeurVenteFc(),
      this.totalValeurVenteUsd(),
      ''
    ]);

    totalRow.font = { bold: true };
    totalRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAF7' } };
      cell.border = this.excelBorder();
    });

    worksheet.columns = [
      { width: 35 }, { width: 20 }, { width: 22 }, { width: 18 }, { width: 16 },
      { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 },
      { width: 16 }, { width: 16 }, { width: 18 }, { width: 18 },
      { width: 12 }, { width: 18 }, { width: 18 }, { width: 18 }, { width: 18 },
      { width: 18 }, { width: 18 }, { width: 20 }, { width: 20 }, { width: 14 }
    ];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber >= 3) {
        row.eachCell((cell, colNumber) => {
          cell.border = this.excelBorder();
          cell.alignment = {
            vertical: 'middle',
            horizontal: colNumber >= 6 && colNumber <= 22 ? 'right' : 'left'
          };

          if (colNumber >= 6 && colNumber <= 22) {
            cell.numFmt = '#,##0.00';
          }

          if (colNumber === 6) {
            cell.numFmt = '#,##0.000';
          }
        });
      }
    });

    worksheet.autoFilter = { from: 'A3', to: 'W3' };
    worksheet.views = [{ state: 'frozen', ySplit: 3 }];

    const buffer = await workbook.xlsx.writeBuffer();

    saveAs(
      new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }),
      'stock-actuel.xlsx'
    );
  }

  exportPdf(): void {
    const doc = new jsPDF('landscape', 'mm', 'a4');

    doc.setFontSize(16);
    doc.text('Rapport Stock Actuel', 14, 15);

    doc.setFontSize(9);
    doc.text(`Lignes : ${this.totalProduits()}`, 14, 24);
    doc.text(`Quantite : ${this.formatPdfNumber(this.totalQuantite(), 3)}`, 45, 24);
    doc.text(`Revient FC : ${this.formatPdfNumber(this.totalRevientFc())} FC`, 95, 24);
    doc.text(`Revient USD : ${this.formatPdfNumber(this.totalRevientUsd(), 4)} USD`, 160, 24);
    doc.text(`Vente FC : ${this.formatPdfNumber(this.totalValeurVenteFc())} FC`, 225, 24);

    autoTable(doc, {
      startY: 32,
      head: [[
        'Produit',
        'Code',
        'Depot',
        'Qte',
        'Taux',
        'PMP FC',
        'PMP USD',
        'Val. FC',
        'Val. USD',
        'Marge FC',
        'Marge USD',
        'PV FC',
        'PV USD',
        'Vente FC',
        'Vente USD',
        'Statut'
      ]],
      body: this.filteredStocks().map(row => [
        this.cleanPdfText(row.nomProduit),
        this.cleanPdfText(row.codeBarre),
        this.cleanPdfText(row.nomDepot),
        this.formatPdfNumber(row.quantiteDisponible, 3),
        this.formatPdfNumber(row.tauxChangeUtilise, 2),
        this.formatPdfNumber(this.getPmpFc(row), 2),
        this.formatPdfNumber(this.getPmpUsd(row), 4),
        this.formatPdfNumber(this.getValeurStockFc(row), 2),
        this.formatPdfNumber(this.getValeurStockUsd(row), 4),
        this.formatPdfNumber(this.getMargeTotaleFc(row), 2),
        this.formatPdfNumber(this.getMargeTotaleUsd(row), 4),
        this.formatPdfNumber(this.getPrixVenteUnitaireFc(row), 2),
        this.formatPdfNumber(this.getPrixVenteUnitaireUsd(row), 4),
        this.formatPdfNumber(this.getValeurVentePotentielleFc(row), 2),
        this.formatPdfNumber(this.getValeurVentePotentielleUsd(row), 4),
        this.cleanPdfText(this.getStatutLabel(this.getResolvedStatut(row)))
      ]),
      styles: { fontSize: 6, cellPadding: 1.2, overflow: 'linebreak' },
      headStyles: { fontSize: 6, halign: 'center' },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 18 },
        2: { cellWidth: 18 },
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
        13: { halign: 'right' },
        14: { halign: 'right' },
        15: { halign: 'center' }
      }
    });

    doc.save('stock-actuel.pdf');
  }

  formatNumber(value: number | string | null | undefined, digits = 2): string {
    return this.formatPdfNumber(value, digits);
  }

  formatPercent(value: number | string | null | undefined): string {
    return `${this.formatPdfNumber(value, 2)} %`;
  }

  formatPdfNumber(value: number | string | null | undefined, digits = 2): string {
    const n = Number(value ?? 0);
    return n.toFixed(digits).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
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

  trackByProduitDepot = (_index: number, row: StockProduitView): string =>
    `${row.produitId}-${row.depotId}`;
}
