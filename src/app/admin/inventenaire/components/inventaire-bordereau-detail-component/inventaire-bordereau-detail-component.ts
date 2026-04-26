import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { InventaireBordereauStoreService } from '../../service/bordereau/inventaire-bordereau-store.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
      next: () => this.loadDetail()
    });
  }

  validerBordereau(): void {
    if (!this.bordereauId) return;

    this.bordereauStore.validerBordereau(this.bordereauId, 'ADMIN POS', {
      next: () => this.loadDetail()
    });
  }

  miseAJourStock(): void {
    if (!this.bordereauId) return;

    this.bordereauStore.miseAJourStock(this.bordereauId, 'ADMIN POS', {
      next: () => this.loadDetail()
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
    next: () => this.loadDetail()
  });
}



  canUpdateStock(): boolean {
    return this.bordereau?.statut === 'VALIDE' && !this.bordereau?.stockMisAJour;
}


printBordereauPdf(): void {
  if (!this.bordereau) {
    return;
  }

  const doc = new jsPDF('p', 'mm', 'a4');

  const marginLeft = 10;
  let y = 14;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('BORDEREAU DE COMPTAGE PHYSIQUE', marginLeft, y);

  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  doc.text(`Réf. bordereau : ${this.bordereau.reference || '-'}`, marginLeft, y);
  y += 6;
  doc.text(`N° bordereau : ${this.bordereau.numeroOrdre ?? '-'}`, marginLeft, y);
  y += 6;
  doc.text(`Locator global : ${this.bordereau.locatorCode || 'Tous'}`, marginLeft, y);
  y += 6;
  doc.text(`Statut : ${this.bordereau.statut || '-'}`, marginLeft, y);

  y += 8;

  const showTheo = !!this.bordereau.afficherQuantiteTheorique;

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
        row.quantiteTheorique ?? '',
        row.quantiteComptee ?? ''
      ];
    }

    return [
      row.numeroLigne ?? '',
      row.codeArticle || '-',
      row.designation || '-',
      row.locatorCode || '-',
      row.quantiteComptee ?? ''
    ];
  });

  autoTable(doc, {
    startY: y,
    head,
    body,
    styles: {
      fontSize: 8.5,
      cellPadding: 2,
      valign: 'middle',
      overflow: 'linebreak'
    },
    headStyles: {
      fontStyle: 'bold'
    },
    columnStyles: showTheo
      ? {
          0: { cellWidth: 14 },
          1: { cellWidth: 28 },
          2: { cellWidth: 56 },
          3: { cellWidth: 28 },
          4: { cellWidth: 24 },
          5: { cellWidth: 30 }
        }
      : {
          0: { cellWidth: 14 },
          1: { cellWidth: 30 },
          2: { cellWidth: 66 },
          3: { cellWidth: 30 },
          4: { cellWidth: 36 }
        }
  });

  const finalY = (doc as any).lastAutoTable.finalY || y + 10;

  doc.setFontSize(10);
  doc.text('Agent de comptage : ____________________', marginLeft, finalY + 12);
  doc.text('Contrôle : ____________________', marginLeft + 70, finalY + 12);
  doc.text('Validation : ____________________', marginLeft + 130, finalY + 12);

  doc.save(`${this.bordereau.reference || 'bordereau-comptage'}.pdf`);
}
}
