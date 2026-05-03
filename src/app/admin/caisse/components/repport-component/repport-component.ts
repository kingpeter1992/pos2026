import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CaisseService } from '../../services/caisse-service';
import { CaisseGraphDialogComponent } from '../caisse-graph-dialog-component/caisse-graph-dialog-component';
import { finalize } from 'rxjs';
type DeviseFilter = 'ALL' | 'USD' | 'CDF';

@Component({
  selector: 'app-repport-component',
  templateUrl: './repport-component.html',
  styleUrl: './repport-component.css',
  standalone:false,
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class RepportComponent implements OnInit {

  dateFrom!: string;
  dateTo!: string;

  displayedColumns: string[] = [
    'date',
    'reference',
    'type',
    'devise',
    'montant',
    'taux',
    'conversion',
    'avant',
    'apres',
    'receipt'
  ];

  deviseFilter: DeviseFilter = 'ALL';
  search = '';

  reportRaw: any = null;
  operationsView: any[] = [];

  summaryView = {
    totalEncUSD: 0,
    totalDecUSD: 0,
    totalEncCDF: 0,
    totalDecCDF: 0,
    netUSD: 0,
    netCDF: 0
  };

  loading = false;
  report: any = null;

  constructor(
    private caisseService: CaisseService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const today = new Date();
    const iso = today.toISOString().slice(0, 10);

    this.dateFrom = iso;
    this.dateTo = iso;

    this.loadReport();
  }

loadReport(): void {
  if (!this.dateFrom || !this.dateTo) return;

  this.loading = true;

  this.caisseService.getCaisseReport(this.dateFrom, this.dateTo)
    .pipe(finalize(() => this.loading = false))
    .subscribe({
      next: (res) => {
        const normalized = this.normalizeReport(res);

        this.reportRaw = normalized;
        this.report = normalized;

        this.operationsView = normalized.operations || [];
        this.summaryView = this.computeSummary(this.operationsView);

        this.applyFilters();
      },
      error: (err) => {
        console.error(err);

        this.reportRaw = null;
        this.report = null;
        this.operationsView = [];

        this.snackBar.open(
          err?.error?.message || 'Erreur chargement rapport',
          'OK',
          { duration: 4000 }
        );
      }
    });
}
  normalizeReport(res: any): { summary: any; operations: any[] } {
    if (res?.operations) {
      return {
        summary: res.summary ?? null,
        operations: Array.isArray(res.operations) ? res.operations : []
      };
    }

    if (res?.data?.operations) {
      return {
        summary: res.data.summary ?? null,
        operations: Array.isArray(res.data.operations) ? res.data.operations : []
      };
    }

    if (Array.isArray(res)) {
      return {
        summary: null,
        operations: res
      };
    }

    return {
      summary: null,
      operations: []
    };
  }

  applyFilters(): void {
    if (!this.reportRaw) return;

    const ops = (this.reportRaw.operations || []) as any[];
    const q = (this.search || '').toLowerCase().trim();

    this.operationsView = ops.filter(op => {
      const okDevise = this.deviseFilter === 'ALL' || op.devise === this.deviseFilter;

      if (!q) return okDevise;

      const blob = `
        ${op.reference ?? ''}
        ${op.description ?? ''}
        ${op.category ?? ''}
        ${op.type ?? ''}
        ${op.devise ?? ''}
        ${op.modePaiement ?? ''}
      `.toLowerCase();

      return okDevise && blob.includes(q);
    });

    this.summaryView = this.computeSummary(this.operationsView);
  }

  computeSummary(ops: any[]) {
    let totalEncUSD = 0;
    let totalDecUSD = 0;
    let totalEncCDF = 0;
    let totalDecCDF = 0;

    for (const t of ops) {
      const montant = Number(t?.montant ?? 0);
      const devise = (t?.devise ?? '').toString().toUpperCase();
      const type = (t?.type ?? '').toString().toUpperCase();

      if (devise === 'USD') {
        if (type === 'ENCAISSEMENT') totalEncUSD += montant;
        if (type === 'DECAISSEMENT') totalDecUSD += montant;
      }

      if (devise === 'CDF') {
        if (type === 'ENCAISSEMENT') totalEncCDF += montant;
        if (type === 'DECAISSEMENT') totalDecCDF += montant;
      }
    }

    return {
      totalEncUSD: this.round2(totalEncUSD),
      totalDecUSD: this.round2(totalDecUSD),
      totalEncCDF: this.round2(totalEncCDF),
      totalDecCDF: this.round2(totalDecCDF),
      netUSD: this.round2(totalEncUSD - totalDecUSD),
      netCDF: this.round2(totalEncCDF - totalDecCDF)
    };
  }

  getTauxOperation(op: any): number {
    return Number(op?.tauxChange ?? op?.tauxUtilise ?? op?.taux ?? 0);
  }

  getConversionValue(op: any): number {
    const montant = Number(op?.montant ?? 0);
    const taux = this.getTauxOperation(op);
    const devise = (op?.devise ?? '').toString().toUpperCase();

    if (!montant || !taux) return 0;

    if (devise === 'USD') {
      return montant * taux;
    }

    if (devise === 'CDF') {
      return montant / taux;
    }

    return 0;
  }

  getConversionDevise(op: any): 'USD' | 'CDF' | '' {
    const devise = (op?.devise ?? '').toString().toUpperCase();

    if (devise === 'USD') return 'CDF';
    if (devise === 'CDF') return 'USD';

    return '';
  }

  getConversionLabel(op: any): string {
    const value = this.getConversionValue(op);
    const devise = this.getConversionDevise(op);

    if (!value || !devise) return '—';

    return this.formatMontant(value, devise);
  }

  async exportPDF(): Promise<void> {
    if (!this.operationsView?.length) return;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const logoDataUrl = await this.loadImageAsDataURL('assets/img/logop.jpg').catch(() => null);

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'JPEG', 14, 8, 16, 16);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('PEACE SECURITY', 34, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Rapport de Caisse', 34, 20);

    doc.setFontSize(8);
    doc.text(`Période : ${this.dateFrom} → ${this.dateTo}`, 34, 26);
    doc.text(`Devise : ${this.deviseFilter} | Recherche : ${this.search || '—'}`, 34, 31);

    doc.text(`Émis le : ${new Date().toLocaleString('fr-FR')}`, pageWidth - 14, 14, { align: 'right' });
    doc.text(`Lignes : ${this.operationsView.length}`, pageWidth - 14, 20, { align: 'right' });

    doc.setDrawColor(180);
    doc.line(14, 36, pageWidth - 14, 36);

    const s = this.summaryView;

    autoTable(doc, {
      startY: 41,
      theme: 'grid',
      head: [['KPI', 'Valeur']],
      body: [
        ['Encaissement USD', this.formatMontant(s.totalEncUSD, 'USD')],
        ['Décaissement USD', this.formatMontant(s.totalDecUSD, 'USD')],
        ['Net USD', this.formatMontant(s.netUSD, 'USD')],
        ['Encaissement CDF', this.formatMontant(s.totalEncCDF, 'CDF')],
        ['Décaissement CDF', this.formatMontant(s.totalDecCDF, 'CDF')],
        ['Net CDF', this.formatMontant(s.netCDF, 'CDF')],
      ],
      styles: {
        fontSize: 7,
        cellPadding: 2,
        overflow: 'ellipsize'
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: 255
      },
      columnStyles: {
        0: { cellWidth: 58 },
        1: { cellWidth: 95, halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 14 }
    });

    const afterKpiY = (doc as any).lastAutoTable.finalY + 6;

    const rows = this.operationsView.map(op => {
      const sign = op.type === 'DECAISSEMENT' ? '-' : '+';
      const devise = this.normalizeDevise(op.devise);

      return [
        this.formatDate(op.dateTransaction),
        op.reference ?? '',
        op.category ?? '',
        op.type ?? '',
        devise,
        `${sign} ${this.formatMontant(op.montant, devise)}`,
        this.getTauxOperation(op) ? this.formatNumber(this.getTauxOperation(op)) : '-',
        this.getConversionLabel(op),
        this.formatMontant(op.soldeAvant, devise),
        this.formatMontant(op.soldeApres, devise),
        op.modePaiement ?? '',
        (op.description ?? '').toString()
      ];
    });

    autoTable(doc, {
      startY: afterKpiY,
      theme: 'striped',
      head: [[
        'Date',
        'Réf',
        'Cat',
        'Type',
        'Dev',
        'Montant',
        'Taux',
        'Conversion',
        'Avant',
        'Après',
        'Payt',
        'Desc'
      ]],
      body: rows,
      styles: {
        fontSize: 6.3,
        cellPadding: 1.5,
        overflow: 'ellipsize',
        valign: 'middle'
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 20 },
        2: { cellWidth: 17 },
        3: { cellWidth: 18 },
        4: { cellWidth: 9 },
        5: { cellWidth: 28, halign: 'right' },
        6: { cellWidth: 18, halign: 'right' },
        7: { cellWidth: 30, halign: 'right' },
        8: { cellWidth: 28, halign: 'right' },
        9: { cellWidth: 28, halign: 'right' },
        10: { cellWidth: 18 },
        11: { cellWidth: 41 }
      },
      margin: { left: 14, right: 14 },
      didParseCell: data => {
        if (data.section === 'body' && [5, 6, 7, 8, 9].includes(data.column.index)) {
          data.cell.styles.fontStyle = 'bold';
        }
      },
      didDrawPage: () => {
        const pageNumber = doc.getCurrentPageInfo().pageNumber;
        const totalPages = doc.getNumberOfPages();

        doc.setFontSize(7.5);
        doc.setTextColor(120);
        doc.text('PEACE SECURITY • Rapport de caisse', 14, pageHeight - 8);
        doc.text(`Page ${pageNumber} / ${totalPages}`, pageWidth - 14, pageHeight - 8, {
          align: 'right'
        });
      }
    });

    doc.save(`rapport_caisse_${Date.now()}.pdf`);
  }

  async preview(op: any): Promise<void> {
    if (!op) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 170]
    });

    const W = doc.internal.pageSize.getWidth();
    let y = 8;

    try {
      const logoDataUrl = await this.loadImageAsDataURL('assets/img/logop.jpg');
      doc.addImage(logoDataUrl, 'JPEG', (W - 16) / 2, y, 16, 16);
      y += 18;
    } catch {
      y += 2;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('PEACE SECURITY', W / 2, y, { align: 'center' });
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('RECU MOUVEMENT CAISSE', W / 2, y, { align: 'center' });
    y += 6;

    doc.setDrawColor(160);
    doc.line(6, y, W - 6, y);
    y += 5;

    y = this.receiptRow(doc, y, 'Reference', String(op.reference ?? op.id ?? '-'));
    y = this.receiptRow(doc, y, 'Date Heure', this.formatReceiptDate(op.dateTransaction));
    y = this.receiptRow(doc, y, 'Mode paiement', String(op.modePaiement ?? '-'));
    y = this.receiptRow(doc, y, 'Devise', String(op.devise ?? '-'));
    y = this.receiptRow(doc, y, 'Categorie', String(op.category ?? '-'));
    y = this.receiptRow(doc, y, 'Taux utilise', this.getTauxOperation(op) ? this.formatNumber(this.getTauxOperation(op)) : '-');
    y = this.receiptRow(doc, y, 'Conversion', this.getConversionLabel(op));

    y += 2;
    doc.setDrawColor(220);
    doc.line(6, y, W - 6, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Montant', 6, y);

    const sign = op.type === 'DECAISSEMENT' ? '-' : '+';
    const montantAffiche = `${sign} ${this.formatMontant(op.montant, op.devise)}`;

    doc.text(this.sanitizeText(montantAffiche), W - 6, y, { align: 'right' });
    y += 7;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Description', 6, y);
    y += 4;

    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(this.sanitizeText(op.description || '-'), W - 12);
    doc.text(descLines, 6, y);
    y += descLines.length * 4 + 6;

    doc.setDrawColor(180);
    doc.line(6, y, W - 6, y);
    y += 6;

    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text('Merci pour votre confiance.', W / 2, y, { align: 'center' });

    doc.save(`recu_${op.reference || op.id || Date.now()}.pdf`);
  }

  OpenGrapicComponent(): void {
    this.dialog.open(CaisseGraphDialogComponent, {
      width: '1100px',
      maxWidth: '95vw',
      height: '80vh',
      data: {
        operations: this.reportRaw?.operations || []
      }
    });
  }

  private normalizeDevise(devise: any): 'USD' | 'CDF' {
    return String(devise ?? '').toUpperCase() === 'USD' ? 'USD' : 'CDF';
  }

  private round2(n: number): number {
    return Math.round(n * 100) / 100;
  }

  private formatNumber(value: any): string {
    return Number(value ?? 0).toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  formatMontant(value: any, devise?: string): string {
    const montant = Number(value ?? 0);

    const nombre = Number.isFinite(montant)
      ? montant.toLocaleString('fr-FR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
      : '0,00';

    return `${nombre} ${devise ?? ''}`.trim();
  }

  private formatDate(dt: any): string {
    if (!dt) return '';
    const d = new Date(dt);

    return isNaN(d.getTime())
      ? String(dt)
      : d.toLocaleString('fr-FR');
  }

  private formatReceiptDate(dateValue: any): string {
    if (!dateValue) return '-';

    const d = new Date(dateValue);

    if (isNaN(d.getTime())) return '-';

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  }

  private receiptRow(doc: jsPDF, y: number, label: string, value: string): number {
    const W = doc.internal.pageSize.getWidth();

    const safeLabel = this.sanitizeText(label);
    const safeValue = this.sanitizeText(value || '-');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(safeLabel, 6, y);

    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(safeValue, 36);
    doc.text(lines, W - 6, y, { align: 'right' });

    return y + Math.max(lines.length * 4, 5);
  }

  private sanitizeText(value: any): string {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[–—]/g, '-')
      .replace(/…/g, '...')
      .replace(/\\/g, '')
      .trim();
  }

  private async loadImageAsDataURL(path: string): Promise<string> {
    const res = await fetch(path);
    const blob = await res.blob();

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject('Erreur chargement logo');

      reader.readAsDataURL(blob);
    });
  }
}
