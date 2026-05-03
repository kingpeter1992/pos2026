import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { InventaireBordereauStoreService } from '../../service/bordereau/inventaire-bordereau-store.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Toast } from '../../../../shares/services/toast/toast';

@Component({
  selector: 'app-inventaire-bordereau-detail-component',
  templateUrl: './inventaire-bordereau-detail-component.html',
  styleUrl: './inventaire-bordereau-detail-component.css',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventaireBordereauDetailComponent  implements OnInit {

  readonly bordereauStore = inject(InventaireBordereauStoreService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(Toast);


  bordereauId!: number;
  bordereau: any | null = null;
  lignesEditables: any[] = [];

  readonly lignes = this.bordereauStore.lignes;
  readonly loading = this.bordereauStore.loading;
  readonly submitting = this.bordereauStore.submitting;

  readonly totalLignes = computed(() => this.lignesEditables.length);
  readonly totalSaisies = computed(() =>
    this.lignesEditables.filter(
      l => l.quantiteComptee !== null && l.quantiteComptee !== undefined && l.quantiteComptee !== ''
    ).length
  );

  ngOnInit(): void {
    this.bordereauId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.bordereauId) {
      this.loadDetail();
    }
  }

  private loadDetail(): void {
    this.bordereauStore.loadLignes(this.bordereauId, (rows) => {
      this.lignesEditables = rows.map(row => ({
        ...row,
        quantiteComptee: row.quantiteComptee ?? null,
        commentaire: row.commentaire ?? ''
      }));
    });

    const current = this.bordereauStore.bordereaux().find(b => b.id === this.bordereauId);
    if (current) {
      this.bordereau = current;
    }
  }

  saveComptage(): void {
    if (!this.bordereauId) return;

    const payload = this.lignesEditables.map(row => ({
      id: row.id,
      quantiteComptee:
        row.quantiteComptee !== null &&
        row.quantiteComptee !== undefined &&
        row.quantiteComptee !== ''
          ? Number(row.quantiteComptee)
          : null,
      commentaire: row.commentaire || null,
      saisiPar: 'ADMIN'
    }));

    this.bordereauStore.saveLignes(this.bordereauId, payload, {
      next: () => {this.loadDetail()
        this.toast.success('Comptage enregistré avec succès');
        this.router.navigate(['admin/inventaire/inventaires']);
            }
    });
  }

  validerBordereau(): void {
    if (!this.bordereauId) return;
    this.bordereauStore.validerBordereau(this.bordereauId, 'ADMIN POS', {
      next: () =>{
        this.loadDetail();
        this.toast.success('Bordereau validé avec succès');
        this.router.navigate(['admin/inventaire/inventaires']);
      }
    });
  }

  miseAJourStock(): void {
    if (!this.bordereauId) return;
    this.bordereauStore.miseAJourStock(this.bordereauId, 'ADMIN', {
      next: () => {
        this.loadDetail();
        this.toast.success('Stock mis à jour avec succès');
        this.router.navigate(['admin/inventaire/inventaires']);
      }
    });
  }



  canEdit(): boolean {
  const statut = this.bordereau?.statut;

  return statut !== 'STOCK_MIS_A_JOUR'
    && statut !== 'CLOTURE'
    && statut !== 'CLOTUREE'
    && statut !== 'ANNULE';
}

canValidate(): boolean {
  const statut = this.bordereau?.statut;

  return statut !== 'VALIDE'
    && statut !== 'STOCK_MIS_A_JOUR'
    && statut !== 'CLOTURE'
    && statut !== 'CLOTUREE'
    && statut !== 'ANNULE';
}



canLancerVariances(): boolean {
  return this.bordereau?.statut !== 'STOCK_MIS_A_JOUR'
    && this.bordereau?.statut !== 'CLOTURE'
    && this.bordereau?.statut !== 'CLOTUREE'
    && this.bordereau?.statut !== 'ANNULE';
}


lancerVariances(): void {
  if (!this.bordereauId) return;

  this.bordereauStore.lancerVariances(this.bordereauId, {
    next: () => {
      this.loadDetail();
      this.toast.success('Variances lancées avec succès');
      this.router.navigate(['admin/inventaire/inventaires']);
    }

  });
}



  canUpdateStock(): boolean {
    return this.bordereau?.statut === 'VALIDE' && !this.bordereau?.stockMisAJour;
}


printBordereauPdf(): void {
  if (!this.bordereau) return;

  const doc = new jsPDF('p', 'mm', 'a4');

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const marginX = 12;
  let y = 12;

  const showTheo = !!this.bordereau.afficherQuantiteTheorique;

  const formatQty = (value: any): string => {
    if (value === null || value === undefined || value === '') return '';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3
    }).format(Number(value));
  };

  const drawHeader = (): void => {
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(marginX, 8, pageWidth - marginX * 2, 30, 3, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('BORDEREAU DE COMPTAGE PHYSIQUE', marginX + 5, 19);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Inventaire • Comptage • Validation stock', marginX + 5, 26);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(this.bordereau.reference || '-', pageWidth - marginX - 5, 19, {
      align: 'right'
    });

    doc.setFont('helvetica', 'normal');
    doc.text(`Date impression : ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - marginX - 5, 26, {
      align: 'right'
    });

    doc.setTextColor(15, 23, 42);
  };

  const drawInfoBox = (): void => {
    y = 45;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(marginX, y, pageWidth - marginX * 2, 34, 3, 3, 'FD');

    const col1 = marginX + 5;
    const col2 = marginX + 72;
    const col3 = marginX + 138;

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');

    doc.text('RÉF. BORDEREAU', col1, y + 8);
    doc.text('N° BORDEREAU', col2, y + 8);
    doc.text('STATUT', col3, y + 8);

    doc.text('LOCATOR', col1, y + 22);
    doc.text('INVENTAIRE', col2, y + 22);
    doc.text('LIGNES', col3, y + 22);

    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');

    doc.text(String(this.bordereau.reference || '-'), col1, y + 14);
    doc.text(String(this.bordereau.numeroOrdre ?? '-'), col2, y + 14);
    doc.text(String(this.bordereau.statut || '-'), col3, y + 14);

    doc.text(String(this.bordereau.locatorCode || 'Tous'), col1, y + 28);
    doc.text(String(this.bordereau.inventaireReference || '-'), col2, y + 28);
    doc.text(String(this.lignesEditables.length || 0), col3, y + 28);

    y += 44;
  };

  drawHeader();
  drawInfoBox();

  const head = [
    showTheo
      ? ['Ligne', 'Code article', 'Désignation', 'Locator', 'Qté théorique', 'Comptage physique']
      : ['Ligne', 'Code article', 'Désignation', 'Locator', 'Comptage physique']
  ];

  const body = this.lignesEditables.map((row: any) => {
    if (showTheo) {
      return [
        row.numeroLigne ?? '',
        row.codeArticle || '-',
        row.designation || '-',
        row.locatorCode || '-',
        formatQty(row.quantiteTheorique),
        formatQty(row.quantiteComptee)
      ];
    }

    return [
      row.numeroLigne ?? '',
      row.codeArticle || '-',
      row.designation || '-',
      row.locatorCode || '-',
      formatQty(row.quantiteComptee)
    ];
  });

  autoTable(doc, {
    startY: y,
    head,
    body,
    margin: { left: marginX, right: marginX },
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.2,
      valign: 'middle',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: showTheo
      ? {
          0: { cellWidth: 14, halign: 'center' },
          1: { cellWidth: 28 },
          2: { cellWidth: 58 },
          3: { cellWidth: 28 },
          4: { cellWidth: 26, halign: 'right' },
          5: { cellWidth: 30, halign: 'right' }
        }
      : {
          0: { cellWidth: 14, halign: 'center' },
          1: { cellWidth: 30 },
          2: { cellWidth: 68 },
          3: { cellWidth: 30 },
          4: { cellWidth: 36, halign: 'right' }
        },
    didDrawPage: () => {
      const pageNumber = doc.getNumberOfPages();

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Page ${pageNumber}`,
        pageWidth - marginX,
        pageHeight - 8,
        { align: 'right' }
      );

      doc.text(
        'Document généré automatiquement par le système POS',
        marginX,
        pageHeight - 8
      );
    }
  });

  let finalY = (doc as any).lastAutoTable.finalY || y + 10;

  if (finalY > 235) {
    doc.addPage();
    finalY = 25;
  }

  finalY += 12;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(marginX, finalY, pageWidth - marginX * 2, 36, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);

  const sigY = finalY + 10;
  const lineY = finalY + 25;

  doc.text('Agent de comptage', marginX + 10, sigY);
  doc.text('Contrôle', pageWidth / 2, sigY, { align: 'center' });
  doc.text('Validation / Cachet', pageWidth - marginX - 10, sigY, { align: 'right' });

  doc.setDrawColor(148, 163, 184);

  doc.line(marginX + 10, lineY, marginX + 55, lineY);
  doc.line(pageWidth / 2 - 23, lineY, pageWidth / 2 + 23, lineY);
  doc.line(pageWidth - marginX - 58, lineY, pageWidth - marginX - 10, lineY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);

  doc.text('Nom & signature', marginX + 10, lineY + 5);
  doc.text('Nom & signature', pageWidth / 2, lineY + 5, { align: 'center' });
  doc.text('Signature & cachet', pageWidth - marginX - 10, lineY + 5, { align: 'right' });

  doc.save(`${this.bordereau.reference || 'bordereau-comptage'}.pdf`);
}
}
