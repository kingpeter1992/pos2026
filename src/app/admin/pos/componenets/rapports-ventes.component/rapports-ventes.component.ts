import { AfterViewInit, Component, inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx-js-style';

import {
  RapportVenteDetailResponse,
  RapportVenteFilterRequest
} from '../../../produits/models/rapport-vente-pos.model';

import { RapportVentePosStore } from '../../service/RapportVentePosStore';

@Component({
  selector: 'app-rapports-ventes.component',
  templateUrl: './rapports-ventes.component.html',
  styleUrl: './rapports-ventes.component.css',
  standalone: false
})
export class RapportsVentesComponent implements OnInit, AfterViewInit {

  private readonly fb = inject(FormBuilder);
  private readonly store = inject(RapportVentePosStore);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  readonly loading = this.store.loading;
  readonly kpis = this.store.kpis;
  readonly totalGeneral = this.store.totalGeneral;

  readonly dataSource = new MatTableDataSource<RapportVenteDetailResponse>([]);

  filterForm = this.fb.group({
    dateDebut: [this.todayStart()],
    dateFin: [this.todayEnd()],
    depotId: [null as number | null],
    categorieId: [null as number | null],
    tarifId: [null as number | null],
    caissier: [''],
    devise: ['']
  });

  displayedColumns: string[] = [
    'succursale',
    'numeroCC',
    'dateCC',
    'nomClient',
    'operateur',
    'tarif',
    'cst',
    'reference',
    'designation',
    'quantiteFacturee',
    'coursDevise',

    'prixNetCDF',
    'prixNetUSD',

    'pmpCDF',
    'pmpUSD',

    'totalNetCDF',
    'totalNetUSD',

    'totalPmpCDF',
    'totalPmpUSD',

    'margeCDF',
    'margeUSD',

    'pourcentageMarge',

    'totalTtcCDF',
    'totalTtcUSD'
  ];

  ngOnInit(): void {
    this.configureFilter();
    this.loadRapport();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  resumeCards() {
    const total = this.totalGeneral();

    return [
      {
        title: 'Total net FC',
        value: total?.totalNetCDF ?? 0,
        suffix: 'FC',
        icon: 'payments'
      },
      {
        title: 'Total PMP FC',
        value: total?.totalPmpCDF ?? 0,
        suffix: 'FC',
        icon: 'inventory_2'
      },
      {
        title: 'Marge FC',
        value: total?.margeCDF ?? 0,
        suffix: 'FC',
        icon: 'trending_up'
      },
      {
        title: '% Marge',
        value: total?.pourcentageMarge ?? 0,
        suffix: '%',
        icon: 'percent'
      },
      {
        title: 'Total net USD',
        value: total?.totalNetUSD ?? 0,
        suffix: 'USD',
        icon: 'attach_money'
      },
      {
        title: 'Marge USD',
        value: total?.margeUSD ?? 0,
        suffix: 'USD',
        icon: 'show_chart'
      }
    ];
  }

  private configureFilter(): void {
    this.dataSource.filterPredicate = (row, filter) => {
      const value = [
        row.succursale,
        row.numeroCC,
        row.numeroFacture,
        row.nomClient,
        row.operateur,
        row.cst,
        row.reference,
        row.designation,
        row.tarif,
        row.module,
        row.natureOperation
      ]
        .filter(v => v !== null && v !== undefined)
        .join(' ')
        .toLowerCase();

      return value.includes(filter);
    };
  }

  loadRapport(): void {
    const raw = this.filterForm.getRawValue();

    if (!raw.dateDebut || !raw.dateFin) {
      return;
    }

    const filter: RapportVenteFilterRequest = {
      dateDebut: this.toBackendDate(raw.dateDebut),
      dateFin: this.toBackendDate(raw.dateFin),
      depotId: raw.depotId,
      categorieId: raw.categorieId,
      tarifId: raw.tarifId,
      caissier: raw.caissier?.trim() || null,
      devise: raw.devise?.trim() || null
    };

    this.store.load(filter).subscribe({
      next: res => {
        this.dataSource.data = res.details ?? [];
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
          this.paginator.firstPage();
        }
      },
      error: err => {
        console.error(err);
        this.dataSource.data = [];
      }
    });
  }

  resetFilter(): void {
    this.filterForm.patchValue({
      dateDebut: this.todayStart(),
      dateFin: this.todayEnd(),
      depotId: null,
      categorieId: null,
      tarifId: null,
      caissier: '',
      devise: ''
    });

    this.loadRapport();
  }

  applySearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dataSource.filter = value.trim().toLowerCase();

    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  exportPdf(): void {
    const doc = new jsPDF('l', 'mm', 'a4');

    doc.setFontSize(14);
    doc.text('Rapport des ventes POS', 14, 12);

    doc.setFontSize(9);
    doc.text(`Généré le : ${new Date().toLocaleString('fr-FR')}`, 14, 18);

    autoTable(doc, {
      startY: 24,
      head: [[
        'Cst',
        'Total net FC',
        'Total net USD',
        'Total PMP FC',
        'Total PMP USD',
        'Marge FC',
        'Marge USD',
        '% Marge'
      ]],
      body: [
        ...this.kpis(),
        ...(this.totalGeneral() ? [this.totalGeneral()!] : [])
      ].map(x => [
        x.cst || 'TOTAL',
        this.moneyCDF(x.totalNetCDF),
        this.moneyUSD(x.totalNetUSD),
        this.moneyCDF(x.totalPmpCDF),
        this.moneyUSD(x.totalPmpUSD),
        this.moneyCDF(x.margeCDF),
        this.moneyUSD(x.margeUSD),
        this.percent(x.pourcentageMarge)
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 215, 0] }
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [[
        'Ticket',
        'Date',
        'Client',
        'Caissier',
        'Article',
        'Qté',
        'Taux',
        'Prix FC',
        'PMP FC',
        'Total FC',
        'Total PMP FC',
        'Marge FC',
        '%'
      ]],
      body: this.dataSource.data.map(x => [
        x.numeroCC || '-',
        this.formatDate(x.dateCC),
        x.nomClient || '-',
        x.operateur || '-',
        x.designation || '-',
        this.money(x.quantiteFacturee),
        this.money(x.coursDevise),
        this.moneyCDF(x.prixNetCDF),
        this.moneyCDF(x.pmpCDF),
        this.moneyCDF(x.totalNetCDF),
        this.moneyCDF(x.totalPmpCDF),
        this.moneyCDF(x.margeCDF),
        this.percent(x.pourcentageMarge)
      ]),
      styles: { fontSize: 6 },
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 215, 0] }
    });

    doc.save(`rapport-ventes-pos-${Date.now()}.pdf`);
  }


  exportExcel(): void {
  const now = new Date();

  const kpiRows = [
    ...this.kpis(),
    ...(this.totalGeneral() ? [this.totalGeneral()!] : [])
  ].map(x => ({
    Cst: x.cst,
    'Total net FC': x.totalNetCDF ?? 0,
    'Total net USD': x.totalNetUSD ?? 0,
    'Total PMP FC': x.totalPmpCDF ?? 0,
    'Total PMP USD': x.totalPmpUSD ?? 0,
    'Marge FC': x.margeCDF ?? 0,
    'Marge USD': x.margeUSD ?? 0,
    '% Marge': x.pourcentageMarge ?? 0
  }));

  const detailRows = this.dataSource.data.map(x => ({
    Ticket: x.numeroCC ?? '',
    Date: this.formatDate(x.dateCC),
    Client: x.nomClient ?? '',
    Caissier: x.operateur ?? '',
    Tarif: x.tarif ?? '',
    Cst: x.cst ?? '',
    Référence: x.reference ?? '',
    Désignation: x.designation ?? '',
    Quantité: x.quantiteFacturee ?? 0,
    'Taux change': x.coursDevise ?? 0,

    'Prix net FC': x.prixNetCDF ?? 0,
    'Prix net USD': x.prixNetUSD ?? 0,

    'PMP FC': x.pmpCDF ?? 0,
    'PMP USD': x.pmpUSD ?? 0,

    'Total net FC': x.totalNetCDF ?? 0,
    'Total net USD': x.totalNetUSD ?? 0,

    'Total PMP FC': x.totalPmpCDF ?? 0,
    'Total PMP USD': x.totalPmpUSD ?? 0,

    'Marge FC': x.margeCDF ?? 0,
    'Marge USD': x.margeUSD ?? 0,

    '% Marge': x.pourcentageMarge ?? 0,

    'Total TTC FC': x.totalTtcCDF ?? 0,
    'Total TTC USD': x.totalTtcUSD ?? 0
  }));

  const wb = XLSX.utils.book_new();

const resumeWs = XLSX.utils.aoa_to_sheet([]);
XLSX.utils.sheet_add_json(resumeWs, kpiRows, {
  origin: 'A5',
  skipHeader: false
});

const detailWs = XLSX.utils.aoa_to_sheet([]);
XLSX.utils.sheet_add_json(detailWs, detailRows, {
  origin: 'A5',
  skipHeader: false
});

  this.addSheetTitle(resumeWs, 'RAPPORT DES VENTES POS - RÉSUMÉ', now, 8);
  this.addSheetTitle(detailWs, 'RAPPORT DES VENTES POS - DÉTAILS', now, 23);

  this.styleSheet(resumeWs, kpiRows.length, 8, true);
  this.styleSheet(detailWs, detailRows.length, 23, false);

  XLSX.utils.book_append_sheet(wb, resumeWs, 'Résumé');
  XLSX.utils.book_append_sheet(wb, detailWs, 'Détails');

  XLSX.writeFile(wb, `rapport-ventes-pos-${Date.now()}.xlsx`);
}


private addSheetTitle(ws: any, title: string, date: Date, colCount: number): void {
  const lastCol = XLSX.utils.encode_col(colCount - 1);

  ws['A1'] = {
    t: 's',
    v: title,
    s: {
      font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '111827' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    }
  };

  ws['A2'] = {
    t: 's',
    v: `Généré le : ${date.toLocaleString('fr-FR')}`,
    s: {
      font: { italic: true, sz: 10, color: { rgb: '374151' } },
      alignment: { horizontal: 'left' }
    }
  };

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } }
  ];

  ws['!rows'] = [
    { hpt: 28 },
    { hpt: 20 },
    { hpt: 8 },
    { hpt: 8 }
  ];

  ws['!autofilter'] = {
    ref: `A5:${lastCol}5`
  };
}
private styleSheet(ws: any, rowCount: number, colCount: number, isResume: boolean): void {
  const headerRow = 5;
  const startRow = 6;
  const endRow = startRow + rowCount - 1;

  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '1F2937' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: this.borderStyle()
  };

  const totalStyle = {
    font: { bold: true, color: { rgb: '111827' } },
    fill: { fgColor: { rgb: 'FEF3C7' } },
    alignment: { horizontal: 'right', vertical: 'center' },
    border: this.borderStyle()
  };

  const bodyStyle = {
    font: { color: { rgb: '111827' } },
    alignment: { vertical: 'center' },
    border: this.borderStyle()
  };

  const moneyStyle = {
    ...bodyStyle,
    numFmt: '#,##0.00',
    alignment: { horizontal: 'right', vertical: 'center' }
  };

  const percentStyle = {
    ...bodyStyle,
    numFmt: '0.00"%"',
    alignment: { horizontal: 'right', vertical: 'center' }
  };

  for (let c = 0; c < colCount; c++) {
    const cell = ws[XLSX.utils.encode_cell({ r: headerRow - 1, c })];

    if (cell) {
      cell.s = headerStyle;
    }
  }

  for (let r = startRow; r <= endRow; r++) {
    const isTotalRow = isResume && r === endRow;

    for (let c = 0; c < colCount; c++) {
      const ref = XLSX.utils.encode_cell({ r: r - 1, c });
      const cell = ws[ref];

      if (!cell) continue;

      cell.s = isTotalRow ? totalStyle : bodyStyle;

      if (this.isNumericColumn(c, isResume)) {
        cell.s = isTotalRow ? { ...totalStyle, numFmt: '#,##0.00' } : moneyStyle;
      }

      if (this.isPercentColumn(c, isResume)) {
        cell.s = isTotalRow ? { ...totalStyle, numFmt: '0.00"%"' } : percentStyle;
      }
    }
  }

  ws['!cols'] = isResume
    ? [
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 12 }
      ]
    : [
        { wch: 22 },
        { wch: 18 },
        { wch: 22 },
        { wch: 18 },
        { wch: 14 },
        { wch: 10 },
        { wch: 18 },
        { wch: 32 },
        { wch: 12 },
        { wch: 14 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 18 },
        { wch: 16 },
        { wch: 16 },
        { wch: 12 },
        { wch: 18 },
        { wch: 18 }
      ];

  ws['!freeze'] = { xSplit: 0, ySplit: 5 };
}


private borderStyle(): any {
  return {
    top: { style: 'thin', color: { rgb: 'E5E7EB' } },
    bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
    left: { style: 'thin', color: { rgb: 'E5E7EB' } },
    right: { style: 'thin', color: { rgb: 'E5E7EB' } }
  };
}

private isNumericColumn(index: number, isResume: boolean): boolean {
  if (isResume) {
    return index >= 1 && index <= 6;
  }

  return [
    8, 9, 10, 11, 12, 13, 14, 15,
    16, 17, 18, 19, 21, 22
  ].includes(index);
}

private isPercentColumn(index: number, isResume: boolean): boolean {
  return isResume ? index === 7 : index === 20;
}
  private todayStart(): string {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return this.toInputDateTime(d);
  }

  private todayEnd(): string {
    const d = new Date();
    d.setHours(23, 59, 0, 0);
    return this.toInputDateTime(d);
  }

  private toInputDateTime(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  private toBackendDate(value: string): string {
    return value.length === 16 ? `${value}:00` : value;
  }

  money(value: number | null | undefined): string {
    const n = Number(value ?? 0);

    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number.isFinite(n) ? n : 0);
  }

  moneyCDF(value: number | null | undefined): string {
    return `${this.money(value)} FC`;
  }

  moneyUSD(value: number | null | undefined): string {
    return `${this.money(value)} USD`;
  }

  percent(value: number | null | undefined): string {
    return `${this.money(value)} %`;
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '-';

    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(value));
  }
}
