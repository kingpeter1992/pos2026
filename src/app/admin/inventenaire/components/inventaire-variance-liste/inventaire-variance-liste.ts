import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { InventaireStoreService } from '../../service/inventaire-service/inventaire-store.service';
import { InventaireVariance } from '../../model/inventaire.models';
import { autoTable } from 'jspdf-autotable';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { ServiceInventaire } from '../../service/inventaire-service/service-inventaire';

type InventaireVarianceGroupe = {
  inventaireId: number;
  depotNom: string;
  totalLignes: number;
  totalEcart: number;
  totalValeurEcart: number;
  totalEntree: number;
  totalSortie: number;
  totalNeant: number;
  appliquees: number;
  lignes: InventaireVariance[];
};
@Component({
  selector: 'app-inventaire-variance-liste',
  templateUrl: './inventaire-variance-liste.html',
  styleUrl: './inventaire-variance-liste.css',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush


})
export class InventaireVarianceListe implements OnInit {
 readonly store = inject(InventaireStoreService);
  readonly router = inject(Router);
  readonly serviceRapport = inject(ServiceInventaire);

  readonly loading = this.store.loading;

  // ✅ prendre les variances depuis le store
  readonly variances = this.store.variances;

  readonly search = signal('');
  readonly typeFilter = signal<'TOUS' | 'ENTREE' | 'SORTIE' | 'NEANT'>('TOUS');

  readonly variancesFiltrees = computed(() => {
    const q = this.search().toLowerCase().trim();
    const type = this.typeFilter();

    return this.variances().filter(v => {
      const matchSearch =
        !q ||
        String(v.id).includes(q) ||
        String(v.inventaireId ?? '').includes(q) ||
        String(v.produitNom || '').toLowerCase().includes(q) ||
        String(v.codeBarres || '').toLowerCase().includes(q) ||
        String(v.categorieNom || '').toLowerCase().includes(q) ||
        String(v.depotNom || '').toLowerCase().includes(q) ||
        String(v.locatorCode || '').toLowerCase().includes(q) ||
        String(v.stockTheorique ?? '').includes(q) ||
        String(v.stockPhysiqueRetenu ?? '').includes(q) ||
        String(v.ecart ?? '').includes(q) ||
        String(v.valeurEcart ?? '').includes(q);

      const matchType = type === 'TOUS' || v.type === type;

      return matchSearch && matchType;
    });
  });

  readonly totalLignes = computed(() => this.variancesFiltrees().length);

  readonly totalEcart = computed(() =>
    this.variancesFiltrees().reduce((sum, v) => sum + Number(v.ecart || 0), 0)
  );

  readonly totalValeurEcart = computed(() =>
    this.variancesFiltrees().reduce((sum, v) => sum + Number(v.valeurEcart || 0), 0)
  );

  readonly totalAppliquees = computed(() =>
    this.variancesFiltrees().filter(v => v.appliquee).length
  );
  http: any;
  apiUrl: any;

  ngOnInit(): void {
    this.store.loadAllVariances();

    setTimeout(() => {
      console.log('VARIANCES STORE = ', this.variances());
      console.log('VARIANCES FILTREES = ', this.variancesFiltrees());
    }, 1000);
  }

  onSearch(value: string): void {
    this.search.set(value);
  }

  onTypeChange(value: 'TOUS' | 'ENTREE' | 'SORTIE' | 'NEANT'): void {
    this.typeFilter.set(value);
  }

readonly groupesParInventaire = computed<InventaireVarianceGroupe[]>(() => {
  const map = new Map<number, InventaireVarianceGroupe>();

  for (const v of this.variancesFiltrees()) {
    const inventaireId = Number(v.inventaireId);

    if (!map.has(inventaireId)) {
      map.set(inventaireId, {
        inventaireId,
        depotNom: v.depotNom || '-',
        totalLignes: 0,
        totalEcart: 0,
        totalValeurEcart: 0,
        totalEntree: 0,
        totalSortie: 0,
        totalNeant: 0,
        appliquees: 0,
        lignes: []
      });
    }

    const g = map.get(inventaireId)!;

    g.totalLignes++;
    g.totalEcart += Number(v.ecart || 0);
    g.totalValeurEcart += Number(v.valeurEcart || 0);

    if (v.type === 'ENTREE') g.totalEntree++;
    if (v.type === 'SORTIE') g.totalSortie++;
    if (v.type === 'NEANT') g.totalNeant++;
    if (v.appliquee) g.appliquees++;

    g.lignes.push(v);
  }

  return Array.from(map.values()).sort((a, b) => b.inventaireId - a.inventaireId);
});

private formatNumberSafe(value: any, digits = 2): string {
  const n = Number(value ?? 0);

  return n
    .toLocaleString('fr-FR', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    })
    .replace(/\u202f/g, ' ')
    .replace(/\u00a0/g, ' ');
}

private toNumber(value: any): number {
  return Number(value ?? 0);
}

imprimerRapportVariancePdf(inventaireId: number): void {
  this.serviceRapport.getResumeVariances(inventaireId).subscribe({
    next: (resume) => {
      const doc = new jsPDF('l', 'mm', 'a4');

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const margin = 10;
      const darkBlue: [number, number, number] = [2, 34, 63];
      const lightBlue: [number, number, number] = [232, 240, 248];
      const green: [number, number, number] = [21, 128, 61];
      const red: [number, number, number] = [220, 38, 38];
      const gray: [number, number, number] = [100, 116, 139];

      const reference = resume.referenceInventaire || `INV-${resume.inventaireId}`;

      // ================= HEADER =================
      doc.setFillColor(...darkBlue);
      doc.rect(0, 0, pageWidth, 22, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('RAPPORT DE VARIANCE INVENTAIRE', pageWidth / 2, 10, {
        align: 'center'
      });

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Référence : ${reference}`, pageWidth / 2, 16, {
        align: 'center'
      });

      // ================= INFOS =================
      let y = 30;

      doc.setTextColor(20, 20, 20);
      doc.setDrawColor(210, 210, 210);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 2, 2, 'FD');

      const infoY = y + 8;

      doc.setFontSize(8.5);

      const infoItem = (label: string, value: string, x: number, yy: number) => {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...gray);
        doc.text(label, x, yy);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(20, 20, 20);
        doc.text(value || '-', x, yy + 5);
      };

      infoItem('Date impression', new Date().toLocaleString('fr-FR'), margin + 6, infoY);
      infoItem('Inventaire', reference, margin + 60, infoY);
      infoItem('Dépôt', resume.depotNom || '-', margin + 115, infoY);
      infoItem('Locator', resume.locatorCode || '-', margin + 170, infoY);
      infoItem('Statut', resume.statut || '-', margin + 220, infoY);

      y += 38;

      // ================= BLOC RESUME STYLE =================
      const cardGap = 4;
      const cardCount = 6;
      const cardWidth = (pageWidth - margin * 2 - cardGap * (cardCount - 1)) / cardCount;
      const cardHeight = 20;

      const summaryCards = [
        {
          label: 'LIGNES',
          value: String(resume.totalLignes || 0),
          color: darkBlue
        },
        {
          label: 'ENTRÉES',
          value: String(resume.totalEntrees || 0),
          color: green
        },
        {
          label: 'SORTIES',
          value: String(resume.totalSorties || 0),
          color: red
        },
        {
          label: 'NÉANT',
          value: String(resume.totalNeant || 0),
          color: gray
        },
        {
          label: 'ÉCART NET',
          value: this.formatNumberSafe(
            this.toNumber(resume.totalEcartPositif) + this.toNumber(resume.totalEcartNegatif),
            3
          ),
          color: darkBlue
        },
        {
          label: 'VALEUR NETTE',
          value: this.formatNumberSafe(resume.totalValeurNette, 2),
          color: this.toNumber(resume.totalValeurNette) < 0 ? red : green
        }
      ];

      summaryCards.forEach((card, index) => {
        const x = margin + index * (cardWidth + cardGap);

        doc.setDrawColor(220, 220, 220);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'FD');

        doc.setFillColor(...card.color);
        doc.roundedRect(x, y, 3, cardHeight, 1, 1, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...gray);
        doc.text(card.label, x + 6, y + 7);

        doc.setFontSize(11);
        doc.setTextColor(...card.color);
        doc.text(card.value, x + 6, y + 15);
      });

      y += cardHeight + 8;

      // ================= TABLE KPI DETAILLEE =================
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        tableWidth: pageWidth - margin * 2,
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 8,
          cellPadding: 2.2,
          halign: 'center',
          valign: 'middle',
          lineColor: [210, 210, 210],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: darkBlue,
          textColor: 255,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontStyle: 'bold',
          textColor: [20, 20, 20]
        },
        head: [[
          'ÉCART +',
          'ÉCART -',
          'VALEUR +',
          'VALEUR -',
          'VALEUR NETTE'
        ]],
        body: [[
          this.formatNumberSafe(resume.totalEcartPositif, 3),
          this.formatNumberSafe(resume.totalEcartNegatif, 3),
          this.formatNumberSafe(resume.totalValeurPositive, 2),
          this.formatNumberSafe(resume.totalValeurNegative, 2),
          this.formatNumberSafe(resume.totalValeurNette, 2)
        ]],
        didParseCell: (data: any) => {
          if (data.section !== 'body') return;

          if (data.column.index === 0 || data.column.index === 2) {
            data.cell.styles.textColor = green;
          }

          if (data.column.index === 1 || data.column.index === 3) {
            data.cell.styles.textColor = red;
          }

          if (data.column.index === 4) {
            data.cell.styles.textColor =
              this.toNumber(resume.totalValeurNette) < 0 ? red : green;
          }
        }
      });

      const kpiFinalY = (doc as any).lastAutoTable.finalY || y + 15;

      // ================= TABLE DETAILS CENTREE =================
      const detailTableWidth = 270;
      const detailMarginLeft = (pageWidth - detailTableWidth) / 2;

      autoTable(doc, {
        startY: kpiFinalY + 8,
        margin: {
          left: detailMarginLeft,
          right: detailMarginLeft
        },
        tableWidth: detailTableWidth,
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 7,
          cellPadding: 1.8,
          overflow: 'linebreak',
          valign: 'middle',
          lineColor: [200, 200, 200],
          lineWidth: 0.1,
          textColor: [20, 20, 20]
        },
        headStyles: {
          fillColor: darkBlue,
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 7.2,
          halign: 'center',
          valign: 'middle'
        },
        alternateRowStyles: {
          fillColor: [247, 249, 252]
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 36, halign: 'left' },
          2: { cellWidth: 48, halign: 'left' },
          3: { cellWidth: 35, halign: 'left' },
          4: { cellWidth: 22, halign: 'center' },
          5: { cellWidth: 20, halign: 'right' },
          6: { cellWidth: 20, halign: 'right' },
          7: { cellWidth: 20, halign: 'right' },
          8: { cellWidth: 24, halign: 'right' },
          9: { cellWidth: 24, halign: 'right' },
          10: { cellWidth: 13, halign: 'center' }
        },
        head: [[
          '#',
          'CODE-BARRES',
          'PRODUIT',
          'CATÉGORIE',
          'LOCATOR',
          'THÉO.',
          'PHYS.',
          'ÉCART',
          'PMP',
          'VALEUR',
          'TYPE'
        ]],
        body: (resume.lignes || []).map((l: any, index: number) => [
          String(index + 1),
          l.codeBarres || '-',
          l.produitNom || '-',
          l.categorieNom || '-',
          l.locatorCode || '-',
          this.formatNumberSafe(l.stockTheorique, 3),
          this.formatNumberSafe(l.stockPhysiqueRetenu, 3),
          this.formatNumberSafe(l.ecart, 3),
          this.formatNumberSafe(l.pmp, 2),
          this.formatNumberSafe(l.valeurEcart, 2),
          l.type || '-'
        ]),
        didParseCell: (data: any) => {
          if (data.section !== 'body') return;

          const ligne = resume.lignes?.[data.row.index];
          if (!ligne) return;

          if (data.column.index === 7) {
            const value = this.toNumber(ligne.ecart);

            if (value > 0) {
              data.cell.styles.textColor = green;
              data.cell.styles.fontStyle = 'bold';
            }

            if (value < 0) {
              data.cell.styles.textColor = red;
              data.cell.styles.fontStyle = 'bold';
            }
          }

          if (data.column.index === 9) {
            const value = this.toNumber(ligne.valeurEcart);

            if (value > 0) {
              data.cell.styles.textColor = green;
              data.cell.styles.fontStyle = 'bold';
            }

            if (value < 0) {
              data.cell.styles.textColor = red;
              data.cell.styles.fontStyle = 'bold';
            }
          }

          if (data.column.index === 10) {
            data.cell.styles.fontStyle = 'bold';

            if (ligne.type === 'ENTREE') {
              data.cell.styles.textColor = green;
            }

            if (ligne.type === 'SORTIE') {
              data.cell.styles.textColor = red;
            }

            if (ligne.type === 'NEANT') {
              data.cell.styles.textColor = gray;
            }
          }
        }
      });

      // ================= SIGNATURE + CACHET =================
      const signatureY = pageHeight - 42;

      doc.setTextColor(20, 20, 20);
      doc.setDrawColor(210, 210, 210);
      doc.setFillColor(255, 255, 255);

      doc.roundedRect(margin, signatureY, 75, 25, 2, 2, 'D');
      doc.roundedRect(pageWidth - margin - 75, signatureY, 75, 25, 2, 2, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Préparé par', margin + 5, signatureY + 6);
      doc.text('Validé par', pageWidth - margin - 70, signatureY + 6);

      doc.setDrawColor(150, 150, 150);
      doc.line(margin + 8, signatureY + 18, margin + 68, signatureY + 18);
      doc.line(pageWidth - margin - 67, signatureY + 18, pageWidth - margin - 8, signatureY + 18);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...gray);
      doc.text('Nom & signature', margin + 25, signatureY + 22);
      doc.text('Nom & signature', pageWidth - margin - 50, signatureY + 22);

      // Cachet
      const cachetX = pageWidth / 2 - 22;
      doc.setDrawColor(...darkBlue);
      doc.setTextColor(...darkBlue);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.circle(pageWidth / 2, signatureY + 13, 17, 'D');
      doc.text('CACHET', pageWidth / 2, signatureY + 11, { align: 'center' });
      doc.setFontSize(6);
      doc.text('ENTREPRISE', pageWidth / 2, signatureY + 16, { align: 'center' });

      // ================= PAGINATION PREMIUM =================
      const pageCount = doc.getNumberOfPages();

      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        doc.setDrawColor(...darkBlue);
        doc.setLineWidth(0.4);
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

        doc.setFillColor(...darkBlue);
        doc.roundedRect(pageWidth - margin - 25, pageHeight - 10, 25, 6, 2, 2, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(90, 90, 90);
        doc.text(
          `Rapport généré automatiquement le ${new Date().toLocaleDateString('fr-FR')}`,
          margin,
          pageHeight - 6
        );

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text(
          `${i} / ${pageCount}`,
          pageWidth - margin - 12.5,
          pageHeight - 6,
          { align: 'center' }
        );
      }

      doc.save(`rapport-variance-${reference}.pdf`);
    },

    error: (err) => {
      console.error('Erreur génération rapport variance PDF', err);
    }
  });
}
exporterExcel(): void {
  const rows = this.groupesParInventaire().map(g => ({
    Inventaire: `INV-${g.inventaireId}`,
    Dépôt: g.depotNom,
    Lignes: g.totalLignes,
    'Écart total': this.formatNumberSafe(g.totalEcart, 3),
    'Valeur écart': this.formatNumberSafe(g.totalValeurEcart, 2),
    Entrées: g.totalEntree,
    Sorties: g.totalSortie,
    Néant: g.totalNeant,
    Appliquées: `${g.appliquees} / ${g.totalLignes}`
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Variances');

  worksheet['!cols'] = [
    { wch: 18 },
    { wch: 25 },
    { wch: 12 },
    { wch: 18 },
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 16 }
  ];

  XLSX.writeFile(
    workbook,
    `variances-inventaires-${new Date().toISOString().slice(0, 10)}.xlsx`
  );
}

exporterPdfGlobal(): void {
  const doc = new jsPDF('l', 'mm', 'a4');

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const margin = 10;
  const darkBlue: [number, number, number] = [15, 23, 42];
  const blue: [number, number, number] = [37, 99, 235];
  const green: [number, number, number] = [22, 163, 74];
  const red: [number, number, number] = [220, 38, 38];
  const orange: [number, number, number] = [249, 115, 22];
  const gray: [number, number, number] = [100, 116, 139];

  let y = 12;

  doc.setFillColor(...darkBlue);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 3, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('RAPPORT GLOBAL DES VARIANCES', margin + 6, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Inventaires • Écarts • Valeurs • Application stock', margin + 6, y + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(
    new Date().toLocaleString('fr-FR'),
    pageWidth - margin - 6,
    y + 14,
    { align: 'right' }
  );

  y += 38;

  const cards = [
    {
      label: 'LIGNES',
      value: String(this.totalLignes()),
      color: blue
    },
    {
      label: 'ÉCART TOTAL',
      value: this.formatNumberSafe(this.totalEcart(), 3),
      color: orange
    },
    {
      label: 'VALEUR ÉCART',
      value: this.formatNumberSafe(this.totalValeurEcart(), 2),
      color: this.totalValeurEcart() < 0 ? red : green
    },
    {
      label: 'APPLIQUÉES',
      value: String(this.totalAppliquees()),
      color: green
    }
  ];

  const cardGap = 5;
  const cardWidth = (pageWidth - margin * 2 - cardGap * 3) / 4;
  const cardHeight = 22;

  cards.forEach((card, index) => {
    const x = margin + index * (cardWidth + cardGap);

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'FD');

    doc.setFillColor(...card.color);
    doc.roundedRect(x, y, 3, cardHeight, 1, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...gray);
    doc.text(card.label, x + 7, y + 8);

    doc.setFontSize(12);
    doc.setTextColor(...card.color);
    doc.text(card.value, x + 7, y + 16);
  });

  y += 32;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    tableWidth: pageWidth - margin * 2,
    theme: 'grid',
    head: [[
      'Inventaire',
      'Dépôt',
      'Lignes',
      'Écart total',
      'Valeur écart',
      'Entrées',
      'Sorties',
      'Néant',
      'Appliquées'
    ]],
    body: this.groupesParInventaire().map(g => [
      `INV-${g.inventaireId}`,
      g.depotNom,
      String(g.totalLignes),
      this.formatNumberSafe(g.totalEcart, 3),
      this.formatNumberSafe(g.totalValeurEcart, 2),
      String(g.totalEntree),
      String(g.totalSortie),
      String(g.totalNeant),
      `${g.appliquees} / ${g.totalLignes}`
    ]),
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.2,
      valign: 'middle',
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
      textColor: [30, 41, 59]
    },
    headStyles: {
      fillColor: darkBlue,
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 26, halign: 'center' },
      1: { cellWidth: 48 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 32, halign: 'right' },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 22, halign: 'center' },
      7: { cellWidth: 22, halign: 'center' },
      8: { cellWidth: 28, halign: 'center' }
    },
    didParseCell: (data: any) => {
      if (data.section !== 'body') return;

      const groupe = this.groupesParInventaire()[data.row.index];
      if (!groupe) return;

      if (data.column.index === 3) {
        data.cell.styles.textColor =
          groupe.totalEcart < 0 ? red : groupe.totalEcart > 0 ? green : gray;
        data.cell.styles.fontStyle = 'bold';
      }

      if (data.column.index === 4) {
        data.cell.styles.textColor =
          groupe.totalValeurEcart < 0 ? red : groupe.totalValeurEcart > 0 ? green : gray;
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  const pageCount = doc.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    doc.setDrawColor(...darkBlue);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFontSize(7);
    doc.setTextColor(...gray);
    doc.text(
      `Rapport généré automatiquement le ${new Date().toLocaleDateString('fr-FR')}`,
      margin,
      pageHeight - 6
    );

    doc.setFillColor(...darkBlue);
    doc.roundedRect(pageWidth - margin - 25, pageHeight - 10, 25, 6, 2, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(`${i} / ${pageCount}`, pageWidth - margin - 12.5, pageHeight - 6, {
      align: 'center'
    });
  }

  doc.save(`rapport-global-variances-${new Date().toISOString().slice(0, 10)}.pdf`);
}
}
