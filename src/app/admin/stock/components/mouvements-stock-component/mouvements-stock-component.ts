import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ServiceMouvementStockStore } from '../../service/mouvement/ServiceMouvementStockStore';
import { TransactionStockView } from '../../models/TransactionStockView';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-mouvements-stock-component',
  templateUrl: './mouvements-stock-component.html',
  styleUrl: './mouvements-stock-component.css',
  standalone: false
})
export class MouvementsStockComponent implements OnInit {
 readonly store = inject(ServiceMouvementStockStore);

  readonly displayedColumns: string[] = [
    'date',
    'produit',
    'typeTransaction',
    'quantite',
    'coutUnitaireFinal',
    'valeurMouvement',
    'pmp',
    'document',
    'libelle'
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
      .reduce((sum, m) => sum + Math.abs(Number(m.quantite ?? 0)), 0)
  );

  readonly totalQuantiteSortie = computed(() =>
    this.filteredMouvements()
      .filter(m => this.isSortie(m.typeTransaction))
      .reduce((sum, m) => sum + Math.abs(Number(m.quantite ?? 0)), 0)
  );

  readonly totalValeurEntreeUsd = computed(() =>
    this.filteredMouvements()
      .filter(m => this.isEntree(m.typeTransaction))
      .reduce((sum, m) => sum + this.getValeurMouvementUsd(m), 0)
  );

  readonly totalValeurEntreeFc = computed(() =>
    this.filteredMouvements()
      .filter(m => this.isEntree(m.typeTransaction))
      .reduce((sum, m) => sum + this.getValeurMouvementFc(m), 0)
  );

  readonly totalValeurSortieUsd = computed(() =>
    this.filteredMouvements()
      .filter(m => this.isSortie(m.typeTransaction))
      .reduce((sum, m) => sum + this.getValeurMouvementUsd(m), 0)
  );

  readonly totalValeurSortieFc = computed(() =>
    this.filteredMouvements()
      .filter(m => this.isSortie(m.typeTransaction))
      .reduce((sum, m) => sum + this.getValeurMouvementFc(m), 0)
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

  async exportExcel(): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transactions Stock');

    worksheet.mergeCells('A1:P1');
    const title = worksheet.getCell('A1');
    title.value = 'RAPPORT TRANSACTIONS DE STOCK';
    title.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    title.alignment = { horizontal: 'center', vertical: 'middle' };
    title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };

    worksheet.addRow([]);

    worksheet.addRow([
      'Date',
      'Produit',
      'Dépôt',
      'Type',
      'Quantité',
      'Stock avant',
      'Stock après',
      'Taux',
      'Coût USD',
      'Coût FC',
      'Valeur USD',
      'Valeur FC',
      'PMP avant',
      'PMP après',
      'Référence',
      'Utilisateur'
    ]);

    const header = worksheet.getRow(3);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.alignment = { horizontal: 'center', vertical: 'middle' };
    header.height = 24;

    header.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF305496' } };
      cell.border = this.excelBorder();
    });

    this.filteredMouvements().forEach(row => {
      worksheet.addRow([
        row.dateTransaction ? new Date(row.dateTransaction) : '',
        row.produitNom ?? '',
        row.depotNom ?? '',
        this.getTypeLabel(row.typeTransaction),
        Math.abs(Number(row.quantite ?? 0)),
        Number(row.stockAvant ?? 0),
        Number(row.stockApres ?? 0),
        this.getTaux(row),
        this.getCoutUsd(row),
        this.getCoutFc(row),
        this.getValeurMouvementUsd(row),
        this.getValeurMouvementFc(row),
        Number(row.pmpAvant ?? 0),
        Number(row.pmpApres ?? 0),
        row.referenceDocument ?? '',
        row.utilisateur ?? ''
      ]);
    });

    worksheet.addRow([]);

    const totalRow = worksheet.addRow([
      'TOTAL',
      '',
      '',
      '',
      this.totalQuantiteEntree() - this.totalQuantiteSortie(),
      '',
      '',
      '',
      '',
      '',
      this.totalValeurEntreeUsd() - this.totalValeurSortieUsd(),
      this.totalValeurEntreeFc() - this.totalValeurSortieFc(),
      '',
      '',
      '',
      ''
    ]);

    totalRow.font = { bold: true };
    totalRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAF7' } };
      cell.border = this.excelBorder();
    });

    worksheet.columns = [
      { width: 20 },
      { width: 35 },
      { width: 20 },
      { width: 24 },
      { width: 14 },
      { width: 14 },
      { width: 14 },
      { width: 14 },
      { width: 16 },
      { width: 18 },
      { width: 18 },
      { width: 20 },
      { width: 16 },
      { width: 16 },
      { width: 22 },
      { width: 18 }
    ];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber >= 3) {
        row.eachCell((cell, colNumber) => {
          cell.border = this.excelBorder();
          cell.alignment = {
            vertical: 'middle',
            horizontal: colNumber >= 5 && colNumber <= 14 ? 'right' : 'left'
          };

          if (colNumber === 1 && rowNumber > 3) {
            cell.numFmt = 'dd/mm/yyyy hh:mm';
          }

          if (colNumber >= 5 && colNumber <= 14) {
            cell.numFmt = '#,##0.00';
          }
        });
      }
    });

    worksheet.autoFilter = { from: 'A3', to: 'P3' };
    worksheet.views = [{ state: 'frozen', ySplit: 3 }];

    const buffer = await workbook.xlsx.writeBuffer();

    saveAs(
      new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }),
      'transactions-stock.xlsx'
    );
  }

  exportPdf(): void {
    const doc = new jsPDF('landscape', 'mm', 'a4');

    doc.setFontSize(16);
    doc.text('Rapport Transactions de Stock', 14, 15);

    doc.setFontSize(9);
    doc.text(`Mouvements : ${this.totalItems()}`, 14, 24);
    doc.text(`Entrees : ${this.totalEntrees()} | Sorties : ${this.totalSorties()}`, 55, 24);
    doc.text(`Valeur entree : ${this.formatPdfNumber(this.totalValeurEntreeUsd())} USD`, 120, 24);
    doc.text(`Valeur sortie : ${this.formatPdfNumber(this.totalValeurSortieUsd())} USD`, 200, 24);

    autoTable(doc, {
      startY: 32,
      head: [[
        'Date',
        'Produit',
        'Type',
        'Qte',
        'Stock',
        'Taux',
        'Cout USD',
        'Cout FC',
        'Val. USD',
        'Val. FC',
        'PMP',
        'Reference',
        'User'
      ]],
      body: this.filteredMouvements().map(row => [
        this.formatDatePdf(row.dateTransaction),
        this.cleanPdfText(row.produitNom),
        this.cleanPdfText(this.getTypeLabel(row.typeTransaction)),
        this.formatPdfNumber(row.quantite, 3),
        `${this.formatPdfNumber(row.stockAvant, 3)} > ${this.formatPdfNumber(row.stockApres, 3)}`,
        this.formatPdfNumber(this.getTaux(row), 2),
        this.formatPdfNumber(this.getCoutUsd(row), 2),
        this.formatPdfNumber(this.getCoutFc(row), 2),
        this.formatPdfNumber(this.getValeurMouvementUsd(row), 2),
        this.formatPdfNumber(this.getValeurMouvementFc(row), 2),
        `${this.formatPdfNumber(row.pmpAvant, 2)} > ${this.formatPdfNumber(row.pmpApres, 2)}`,
        this.cleanPdfText(row.referenceDocument),
        this.cleanPdfText(row.utilisateur)
      ]),
      styles: {
        fontSize: 6,
        cellPadding: 1.4,
        overflow: 'linebreak'
      },
      headStyles: {
        fontSize: 6,
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 38 },
        2: { cellWidth: 24 },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
        8: { halign: 'right' },
        9: { halign: 'right' },
        10: { halign: 'right' }
      }
    });

    doc.save('transactions-stock.pdf');
  }

  formatNumber(value: number | string | null | undefined, digits = 2): string {
    return this.formatPdfNumber(value, digits);
  }

  formatPdfNumber(value: number | string | null | undefined, digits = 2): string {
    const n = Number(value ?? 0);
    return n.toFixed(digits).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  formatDatePdf(value: string | Date | null | undefined): string {
    if (!value) return '-';

    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';

    const date = d.toLocaleDateString('fr-FR');
    const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    return `${date} ${time}`.replace(/\u202F|\u00A0/g, ' ');
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

  trackById = (_: number, row: TransactionStockView) => row.id;

getTaux(row: any): number {
  return Number(row.tauxChangeUtilise || 1);
}

getCoutFc(row: any): number {
  return Number(
    row.coutUnitaireFinalFc ??
    row.coutUnitaireFinal ??
    0
  );
}

getCoutUsd(row: any): number {
  const fc = this.getCoutFc(row);
  const taux = this.getTaux(row);

  return taux > 0 ? fc / taux : 0;
}

getValeurMouvementFc(row: any): number {
  return Number(
    row.valeurMouvementFc ??
    (this.getCoutFc(row) * Number(row.quantite || 0))
  );
}

getValeurMouvementUsd(row: any): number {
  const fc = this.getValeurMouvementFc(row);
  const taux = this.getTaux(row);

  return taux > 0 ? fc / taux : 0;
}

getPmpAvantFc(row: any): number {
  return Number(row.pmpAvant || 0);
}

getPmpApresFc(row: any): number {
  return Number(row.pmpApres || 0);
}

getPmpAvantUsd(row: any): number {
  const taux = this.getTaux(row);
  return taux > 0 ? this.getPmpAvantFc(row) / taux : 0;
}

getPmpApresUsd(row: any): number {
  const taux = this.getTaux(row);
  return taux > 0 ? this.getPmpApresFc(row) / taux : 0;
}
}
