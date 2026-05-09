import { ChangeDetectionStrategy, Component, computed, OnInit, signal } from '@angular/core';
import { InventaireStoreService } from '../../service/inventaire-service/inventaire-store.service';
import * as XLSX from 'xlsx-js-style';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-resultat-component',
  templateUrl: './resultat-component.html',
  styleUrl: './resultat-component.css',
    standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
}


)export class ResultatComponent implements OnInit {

  resultats = computed(() => this.store.resultatsFiltres());
  resultat = computed(() => this.store.resultatSelectionne());
  loading = computed(() => this.store.loadingResultats());


    private readonly _dateFrom = signal<string | null>(this.getDefaultDateFrom());
private readonly _dateTo = signal<string | null>(this.getToday());

  displayedColumns = [
    'numeroInventaire',
    'numeroBordereau',
    'codeArticle',
    'designation',
    'locator',
    'quantiteStockTheorique',
    'quantiteComptee',
    'quantiteEcart',
    'pmpInventaire',
    'valeurEcart',
    'typeVariance',
    'stockActuel',
    'commentaireComptage'
  ];

  constructor(public store: InventaireStoreService) {}

  ngOnInit(): void {
    this.store.loadResultatsInventaires();
  }

  onSelectInventaire(id: number): void {
    this.store.selectInventaire(id);
  }

  onDateChange(from: string | null, to: string | null): void {
    this.store.setDateFilter(from, to);
  }

 money(v: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
    .format(v || 0)
    .replace(/\s/g, ''); // 🔥 enlève tous les espaces
}




readonly dateFrom = computed(() => this._dateFrom());
readonly dateTo = computed(() => this._dateTo());

private getToday(): string {
  return new Date().toISOString().split('T')[0];
}

private getDefaultDateFrom(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.toISOString().split('T')[0];
}

exportExcel(): void {
  const data = this.resultat();
  if (!data) return;

  const wb = XLSX.utils.book_new();

  const title = [
    ['RAPPORT RÉSULTAT INVENTAIRE'],
    [`Inventaire : ${data.inventaire.reference}`],
    [`Dépôt : ${data.inventaire.depotNom || '-'}`],
    [`Date : ${data.inventaire.dateInventaire || '-'}`],
    [`Statut : ${data.inventaire.statut || '-'}`],
    []
  ];

  const kpis = [
    ['Indicateur', 'Valeur'],
    ['Total articles', data.kpi.totalArticles],
    ['Articles avec écart', data.kpi.articlesAvecEcart],
    ['Articles sans écart', data.kpi.articlesSansEcart],
    ['% écart articles', `${data.kpi.pourcentageArticlesAvecEcart ?? 0}%`],
    ['Valeur théorique FC', data.kpi.valeurTheoriqueCDF ?? 0],
    ['Valeur comptée FC', data.kpi.valeurCompteeCDF ?? 0],
    ['Écart valeur FC', data.kpi.valeurEcartCDF ?? 0],
    ['Écart positif FC', data.kpi.valeurEcartPositifCDF ?? 0],
    ['Écart négatif FC', data.kpi.valeurEcartNegatifCDF ?? 0],
    ['% écart valeur', `${data.kpi.pourcentageEcartValeur ?? 0}%`],
    ['Stock mis à jour', data.kpi.stockTotalementMisAJour ? 'Oui' : 'Non'],
    []
  ];

  const headers = [
    'Inventaire',
    'Bordereau',
    'Dépôt',
    'Locator',
    'Code article',
    'Désignation',
    'Stock théorique',
    'Stock compté',
    'Écart',
    'PMP inventaire',
    'Valeur théorique FC',
    'Valeur comptée FC',
    'Valeur écart FC',
    'Type variance',
    'Stock actuel',
    'PMP actuel',
    'Valeur stock actuel',
    'Commentaire'
  ];

  const details = data.lignes.map(l => [
    l.numeroInventaire || '',
    l.numeroBordereau || '',
    l.depot || '',
    l.locator || '-',
    l.codeArticle || '',
    l.designation || '',
    l.quantiteStockTheorique ?? 0,
    l.quantiteComptee ?? 0,
    l.quantiteEcart ?? 0,
    l.pmpInventaire ?? 0,
    l.valeurStockTheorique ?? 0,
    l.valeurStockComptee ?? 0,
    l.valeurEcart ?? 0,
    l.typeVariance || '',
    l.stockActuel ?? 0,
    l.pmpActuel ?? 0,
    l.valeurStockActuel ?? 0,
    l.commentaireComptage || ''
  ]);

  const sheetData = [
    ...title,
    ...kpis,
    headers,
    ...details
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  ws['!cols'] = [
    { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 14 },
    { wch: 20 }, { wch: 36 }, { wch: 16 }, { wch: 16 },
    { wch: 12 }, { wch: 16 }, { wch: 20 }, { wch: 20 },
    { wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
    { wch: 22 }, { wch: 35 }
  ];

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }
  ];

  const titleStyle = {
    font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '0F172A' } },
    alignment: { horizontal: 'center', vertical: 'center' }
  };

  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '1E293B' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'CBD5E1' } },
      bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
      left: { style: 'thin', color: { rgb: 'CBD5E1' } },
      right: { style: 'thin', color: { rgb: 'CBD5E1' } }
    }
  };

  const kpiLabelStyle = {
    font: { bold: true, color: { rgb: '334155' } },
    fill: { fgColor: { rgb: 'E2E8F0' } },
    border: {
      bottom: { style: 'thin', color: { rgb: 'CBD5E1' } }
    }
  };

  const normalStyle = {
    border: {
      top: { style: 'thin', color: { rgb: 'E2E8F0' } },
      bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
      left: { style: 'thin', color: { rgb: 'E2E8F0' } },
      right: { style: 'thin', color: { rgb: 'E2E8F0' } }
    },
    alignment: { vertical: 'center' }
  };

  Object.keys(ws).forEach(cell => {
    if (cell.startsWith('!')) return;

    const ref = XLSX.utils.decode_cell(cell);
    const value = ws[cell].v;

    if (ref.r === 0) {
      ws[cell].s = titleStyle;
      return;
    }

    if (ref.r >= 1 && ref.r <= 4) {
      ws[cell].s = {
        font: { bold: ref.c === 0 },
        alignment: { vertical: 'center' }
      };
      return;
    }

    if (ref.r >= 6 && ref.r <= 17 && ref.c === 0) {
      ws[cell].s = kpiLabelStyle;
      return;
    }

    if (ref.r === 19) {
      ws[cell].s = headerStyle;
      return;
    }

    ws[cell].s = normalStyle;

    if (typeof value === 'number') {
      ws[cell].z = '#,##0.00';
    }

    if (ref.r > 19 && ref.c === 8 && typeof value === 'number') {
      if (value > 0) {
        ws[cell].s = {
          ...normalStyle,
          font: { bold: true, color: { rgb: '15803D' } }
        };
      }

      if (value < 0) {
        ws[cell].s = {
          ...normalStyle,
          font: { bold: true, color: { rgb: 'B91C1C' } }
        };
      }
    }
  });

  ws['!autofilter'] = {
    ref: `A20:R${20 + details.length}`
  };

  XLSX.utils.book_append_sheet(wb, ws, 'Résultat inventaire');

  XLSX.writeFile(
    wb,
    `rapport-resultat-inventaire-${data.inventaire.reference}.xlsx`
  );
}


exportPdf(): void {
  const data = this.resultat();
  if (!data) return;

  const doc = new jsPDF('l', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.text('RAPPORT RÉSULTAT INVENTAIRE', 14, 11);

  doc.setFontSize(8);
  doc.text(`Généré le : ${new Date().toLocaleString('fr-FR')}`, 14, 18);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.text(`Inventaire : ${data.inventaire.reference}`, 14, 32);
  doc.text(`Dépôt : ${data.inventaire.depotNom || '-'}`, 14, 37);
  doc.text(`Date inventaire : ${data.inventaire.dateInventaire || '-'}`, 14, 42);
  doc.text(`Statut : ${data.inventaire.statut || '-'}`, 14, 47);

  autoTable(doc, {
    startY: 54,
    head: [['KPI', 'Valeur', 'KPI', 'Valeur']],
    body: [
  ['Total articles', data.kpi.totalArticles, 'Articles avec ecart', data.kpi.articlesAvecEcart],
  ['Articles sans ecart', data.kpi.articlesSansEcart, '% ecart articles', `${data.kpi.pourcentageArticlesAvecEcart ?? 0}%`],
  ['Valeur theorique FC', `${this.money(data.kpi.valeurTheoriqueCDF)} FC`, 'Valeur comptee FC', `${this.money(data.kpi.valeurCompteeCDF)} FC`],
  ['Ecart valeur FC', `${this.money(data.kpi.valeurEcartCDF)} FC`, '% ecart valeur', `${data.kpi.pourcentageEcartValeur ?? 0}%`],
  ['Ecart positif FC', `${this.money(data.kpi.valeurEcartPositifCDF)} FC`, 'Ecart negatif FC', `${this.money(data.kpi.valeurEcartNegatifCDF)} FC`],
  ['Stock mis a jour', data.kpi.stockTotalementMisAJour ? 'Oui' : 'Non', 'Bordereaux MAJ', `${data.kpi.bordereauxMisAJourStock}/${data.kpi.bordereauxTotal}`]
],
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [241, 245, 249] },
      2: { fontStyle: 'bold', fillColor: [241, 245, 249] }
    }
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 8,
    head: [[
      'Inventaire',
      'Bordereau',
      'Code',
      'Désignation',
      'Locator',
      'Théo.',
      'Compté',
      'Écart',
      'PMP',
      'Val. écart',
      'Type',
      'Stock actuel'
    ]],
    body: data.lignes.map(l => [
      l.numeroInventaire || '',
      l.numeroBordereau || '',
      l.codeArticle || '',
      l.designation || '',
      l.locator || '-',
      l.quantiteStockTheorique ?? 0,
      l.quantiteComptee ?? 0,
      l.quantiteEcart ?? 0,
      this.money(l.pmpInventaire),
      this.money(l.valeurEcart),
      l.typeVariance || '',
      l.stockActuel ?? 0
    ]),
    theme: 'grid',
    styles: {
      fontSize: 6.8,
      cellPadding: 1.5,
      overflow: 'linebreak',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      3: { cellWidth: 42 },
      7: { halign: 'right', fontStyle: 'bold' },
      8: { halign: 'right' },
      9: { halign: 'right' }
    },
    didParseCell: hook => {
      if (hook.section === 'body' && hook.column.index === 7) {
        const value = Number(hook.cell.raw || 0);

        if (value > 0) {
          hook.cell.styles.textColor = [21, 128, 61];
          hook.cell.styles.fontStyle = 'bold';
        }

        if (value < 0) {
          hook.cell.styles.textColor = [185, 28, 28];
          hook.cell.styles.fontStyle = 'bold';
        }
      }
    },
    didDrawPage: () => {
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageNo = doc.getNumberOfPages();

      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Page ${pageNo}`,
        pageWidth - 25,
        pageHeight - 8
      );

      doc.text(
        'Document généré automatiquement par POS - Inventaire',
        14,
        pageHeight - 8
      );
    }
  });

  doc.save(`rapport-resultat-inventaire-${data.inventaire.reference}.pdf`);
}
}
