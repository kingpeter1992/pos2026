import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ReceptionAchatStore } from '../../service/reception/ReceptionAchatStore';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReceptionAchatResponse } from '../../models/reception-achat.model';
import { FormBuilder, FormGroup } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import { MatDialog } from '@angular/material/dialog';
import { ReceptionDetailComponent } from '../reception-detail-component/reception-detail-component';

@Component({
  selector: 'app-historique-achats-component',
  templateUrl: './historique-achats-component.html',
  styleUrl: './historique-achats-component.css',
  standalone: false
})
export class HistoriqueAchatsComponent implements OnInit {

private readonly store = inject(ReceptionAchatStore);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);



  displayedColumns: string[] = [
    'select',
    'refReception',
    'dateReception',
    'fournisseurNom',
    'depotNom',
    'refCommande',
    'statut',
    'totalMarchandise',
    'totalFrais',
    'totalGeneral'
  ];

  readonly loading = toSignal(this.store.loading$, {
    initialValue: false
  });

  readonly receptions = toSignal(this.store.receptions$, {
    initialValue: [] as ReceptionAchatResponse[]
  });

  readonly error = toSignal(this.store.error$, {
    initialValue: null
  });

  readonly selectedReception = signal<ReceptionAchatResponse | null>(null);

  alertes = signal<Array<{ nb: number; libelle: string }>>([]);

  ngOnInit(): void {
    this.loadData();
  }



  private loadData(): void {
    this.store.loadIfNeeded().subscribe({
      next: (data) => {
        const list = data ?? [];
        this.buildAlertes(list);

        if (list.length > 0 && !this.selectedReception()) {
          this.selectedReception.set(list[0]);
        }
      },
      error: () => {
        this.alertes.set([]);
      }
    });
  }

  readonly filteredReceptions = computed(() => {
    let data = [...this.receptions()];

    const formValue = this.filterForm.getRawValue();

    const keyword = String(formValue.keyword ?? '').trim().toLowerCase();
    const statut = String(formValue.statut ?? '').trim().toUpperCase();
    const fournisseur = String(formValue.fournisseur ?? '').trim().toLowerCase();
    const depot = String(formValue.depot ?? '').trim().toLowerCase();
    const refCommande = String(formValue.refCommande ?? '').trim().toLowerCase();

const dateDebutTs = formValue.dateDebut ? new Date(formValue.dateDebut).getTime() : null;
const dateFinTs = formValue.dateFin ? new Date(formValue.dateFin).getTime() : null;

    data = data.filter((r) => {
      const refReception = (r.referenceBonReception ?? '').toLowerCase();
      const fournisseurNom = (r.fournisseurNom ?? '').toLowerCase();
      const depotNom = (r.depotNom ?? '').toLowerCase();
      const commande = (r.refCommande ?? '').toLowerCase();
      const statutRow = (r.statut ?? '').toUpperCase();

const receptionDateTs = this.normalizeDateOnly(r.dateReception);
      const matchKeyword =
        !keyword ||
        refReception.includes(keyword) ||
        fournisseurNom.includes(keyword) ||
        depotNom.includes(keyword) ||
        commande.includes(keyword);

      const matchStatut =
        !statut || statutRow === statut;

      const matchFournisseur =
        !fournisseur || fournisseurNom.includes(fournisseur);

      const matchDepot =
        !depot || depotNom.includes(depot);

      const matchCommande =
        !refCommande || commande.includes(refCommande);

const matchDateDebut =
  dateDebutTs == null || receptionDateTs == null || receptionDateTs >= dateDebutTs;

const matchDateFin =
  dateFinTs == null || receptionDateTs == null || receptionDateTs <= dateFinTs;

      const matchValides =
        !formValue.valides || statutRow === 'VALIDE';

      const matchBrouillons =
        !formValue.brouillons || statutRow === 'BROUILLON';

      const matchPartielles =
        !formValue.partielles || statutRow.includes('PARTIEL');

      const matchAnnulees =
        !formValue.annulees || statutRow.includes('ANNULE');

      const matchAvecCommande =
        !formValue.avecCommande || !!r.commandeAchatId;

      const matchSansCommande =
        !formValue.sansCommande || !r.commandeAchatId;

      return (
        matchKeyword &&
        matchStatut &&
        matchFournisseur &&
        matchDepot &&
        matchCommande &&
        matchDateDebut &&
        matchDateFin &&
        matchValides &&
        matchBrouillons &&
        matchPartielles &&
        matchAnnulees &&
        matchAvecCommande &&
        matchSansCommande
      );
    });

    if (formValue.vingtDernieres) {
      data = data
        .sort((a, b) => {
          const da = a.dateReception ? new Date(a.dateReception).getTime() : 0;
          const db = b.dateReception ? new Date(b.dateReception).getTime() : 0;
          return db - da;
        })
        .slice(0, 20);
    }

    return data.sort((a, b) => {
      const da = a.dateReception ? new Date(a.dateReception).getTime() : 0;
      const db = b.dateReception ? new Date(b.dateReception).getTime() : 0;
      return db - da;
    });
  });

  readonly totalReceptions = computed(() => this.filteredReceptions().length);

  readonly totalMarchandise = computed(() =>
    this.filteredReceptions().reduce(
      (sum, r) => sum + Number(r.totalMarchandise ?? 0),
      0
    )
  );

  readonly totalFrais = computed(() =>
    this.filteredReceptions().reduce(
      (sum, r) => sum + Number(r.totalFrais ?? 0),
      0
    )
  );

  readonly totalGeneral = computed(() =>
    this.filteredReceptions().reduce(
      (sum, r) => sum + Number(r.totalGeneral ?? 0),
      0
    )
  );

  readonly totalValidees = computed(() =>
    this.filteredReceptions().filter(r => (r.statut ?? '').toUpperCase() === 'VALIDE').length
  );

  readonly totalPartielles = computed(() =>
    this.filteredReceptions().filter(r => (r.statut ?? '').toUpperCase().includes('PARTIEL')).length
  );

  readonly totalBrouillons = computed(() =>
    this.filteredReceptions().filter(r => (r.statut ?? '').toUpperCase() === 'BROUILLON').length
  );

  search(): void {
    const list = this.filteredReceptions();

    if (!list.length) {
      this.selectedReception.set(null);
      return;
    }

    const current = this.selectedReception();
    if (!current) {
      this.selectedReception.set(list[0]);
      return;
    }

    const stillExists = list.find(r => r.id === current.id);
    this.selectedReception.set(stillExists ?? list[0]);
  }

    openAdvancedFilters(): void {
    console.log('Filtres avancés');
  }

  refresh(): void {
    this.store.reload().subscribe({
      next: (data) => {
        const list = data ?? [];
        this.buildAlertes(list);
        this.selectedReception.set(list[0] ?? null);
      },
      error: () => {
        this.alertes.set([]);
      }
    });
  }

  selectRow(row: ReceptionAchatResponse): void {
    this.selectedReception.set(row);
  }

  openDetail(row: ReceptionAchatResponse | null, event?: MouseEvent): void {
    event?.stopPropagation();
    if (!row?.id) return;
    this.router.navigate(['/admin/receptions', row.id]);
  }

  createReception(): void {
    this.router.navigate(['/admin/receptions/create']);
  }

exportExcel(): void {
  const data = this.filteredReceptions();

  if (!data.length) {
    return;
  }

  const now = new Date();
  const fileName = `receptions_fournisseurs_${now.getTime()}.xlsx`;

  const totalMarchandiseFc = data.reduce((s, r) => s + this.getMarchandiseFc(r), 0);
  const totalFraisFc = data.reduce((s, r) => s + this.getFraisFc(r), 0);
  const totalGeneralFc = data.reduce((s, r) => s + this.getTotalFc(r), 0);

  const totalMarchandiseUsd = data.reduce((s, r) => s + this.getMarchandiseUsd(r), 0);
  const totalFraisUsd = data.reduce((s, r) => s + this.getFraisUsd(r), 0);
  const totalGeneralUsd = data.reduce((s, r) => s + this.getTotalUsd(r), 0);

  const header = [
    'Référence',
    'Date réception',
    'Fournisseur',
    'Dépôt',
    'Commande liée',
    'Statut',
    'Marchandise FC',
    'Marchandise USD',
    'Frais FC',
    'Frais USD',
    'Total général FC',
    'Total général USD'
  ];

  const rows = data.map(row => [
    row.referenceBonReception || row.refReception || `REC-${row.id}`,
    row.dateReception ? new Date(row.dateReception) : '',
    row.fournisseurNom || '',
    row.depotNom || '',
    row.refCommande || '',
    row.statut || '',
    this.getMarchandiseFc(row),
    this.getMarchandiseUsd(row),
    this.getFraisFc(row),
    this.getFraisUsd(row),
    this.getTotalFc(row),
    this.getTotalUsd(row)
  ]);

  const excelData: any[][] = [
    ['HISTORIQUE DES RÉCEPTIONS FOURNISSEURS'],
    [`Exporté le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR')}`],
    [],
    ['Résumé', '', '', '', '', 'Nombre', 'Marchandise FC', 'Marchandise USD', 'Frais FC', 'Frais USD', 'Total FC', 'Total USD'],
    ['', '', '', '', '', data.length, totalMarchandiseFc, totalMarchandiseUsd, totalFraisFc, totalFraisUsd, totalGeneralFc, totalGeneralUsd],
    [],
    header,
    ...rows
  ];

  const ws = XLSX.utils.aoa_to_sheet(excelData);

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 11 } },
    { s: { r: 3, c: 0 }, e: { r: 4, c: 4 } }
  ];

  ws['!cols'] = [
    { wch: 24 },
    { wch: 18 },
    { wch: 32 },
    { wch: 24 },
    { wch: 22 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 }
  ];

  const range = XLSX.utils.decode_range(ws['!ref'] as string);

  const border = {
    top: { style: 'thin', color: { rgb: 'CBD5E1' } },
    bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
    left: { style: 'thin', color: { rgb: 'CBD5E1' } },
    right: { style: 'thin', color: { rgb: 'CBD5E1' } }
  };

  const titleStyle = {
    font: { bold: true, sz: 18, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '0F172A' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border
  };

  const subtitleStyle = {
    font: { italic: true, sz: 11, color: { rgb: '475569' } },
    alignment: { horizontal: 'center', vertical: 'center' }
  };

  const summaryStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '2563EB' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border
  };

  const tableHeaderStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '1E293B' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border
  };

  const bodyStyle = {
    font: { color: { rgb: '0F172A' } },
    alignment: { vertical: 'center' },
    border
  };

  for (let c = 0; c <= 11; c++) {
    const titleCell = XLSX.utils.encode_cell({ r: 0, c });
    const subtitleCell = XLSX.utils.encode_cell({ r: 1, c });

    if (!ws[titleCell]) ws[titleCell] = { t: 's', v: '' };
    if (!ws[subtitleCell]) ws[subtitleCell] = { t: 's', v: '' };

    ws[titleCell].s = titleStyle;
    ws[subtitleCell].s = subtitleStyle;
  }

  for (let c = 0; c <= 11; c++) {
    const cell = XLSX.utils.encode_cell({ r: 3, c });
    if (ws[cell]) ws[cell].s = summaryStyle;
  }

  for (let c = 5; c <= 11; c++) {
    const cell = XLSX.utils.encode_cell({ r: 4, c });

    if (ws[cell]) {
      ws[cell].s = {
        ...bodyStyle,
        font: { bold: true, color: { rgb: '0F172A' } },
        fill: { fgColor: { rgb: 'EFF6FF' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };

      if (c >= 6) {
        ws[cell].z = '#,##0.00';
      }
    }
  }

  for (let c = 0; c <= 11; c++) {
    const cell = XLSX.utils.encode_cell({ r: 6, c });
    if (ws[cell]) ws[cell].s = tableHeaderStyle;
  }

  for (let r = 7; r <= range.e.r; r++) {
    for (let c = 0; c <= range.e.c; c++) {
      const cell = XLSX.utils.encode_cell({ r, c });
      if (!ws[cell]) continue;

      ws[cell].s = {
        ...bodyStyle,
        fill: { fgColor: { rgb: r % 2 === 0 ? 'F8FAFC' : 'FFFFFF' } },
        alignment: {
          horizontal: c >= 6 ? 'right' : c === 5 ? 'center' : 'left',
          vertical: 'center'
        }
      };

      if (c === 1 && ws[cell].v) {
        ws[cell].z = 'dd/mm/yyyy';
      }

      if (c >= 6) {
        ws[cell].z = '#,##0.00';
      }

      if (c === 5) {
        ws[cell].s = {
          ...ws[cell].s,
          font: { bold: true, color: { rgb: '1D4ED8' } }
        };
      }
    }
  }

  ws['!autofilter'] = {
    ref: `A7:L${range.e.r + 1}`
  };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Réceptions');

  const excelBuffer = XLSX.write(wb, {
    bookType: 'xlsx',
    type: 'array',
    cellStyles: true
  });

  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  saveAs(blob, fileName);
}

  validerReception(): void {
    const selected = this.selectedReception();
    if (!selected) return;

    console.log('Valider réception', selected);
  }
detailLignes(): void {
  const selected = this.selectedReception();
  if (!selected) return;

  this.dialog.open(ReceptionDetailComponent, {
    width: '1200px',
    maxWidth: '95vw',
    maxHeight: '90vh',
    data: selected,
    panelClass: 'erp-dialog-panel'
  });
}



  trackByReception(index: number, item: ReceptionAchatResponse): number {
    return Number(item?.id ?? index);
  }

  getStatutClass(statut: string | null | undefined): string {
    const value = (statut ?? '').toUpperCase();

    switch (value) {
      case 'VALIDE':
        return 'success';
      case 'BROUILLON':
        return 'warning';
      case 'PARTIEL':
      case 'PARTIELLE':
        return 'info';
      case 'ANNULE':
      case 'ANNULEE':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  private buildAlertes(data: ReceptionAchatResponse[]): void {
    const brouillons = data.filter(r => (r.statut ?? '').toUpperCase() === 'BROUILLON').length;
    const partielles = data.filter(r => (r.statut ?? '').toUpperCase().includes('PARTIEL')).length;
    const annulees = data.filter(r => (r.statut ?? '').toUpperCase().includes('ANNULE')).length;
    const sansCommande = data.filter(r => !r.commandeAchatId).length;

    const alertes: Array<{ nb: number; libelle: string }> = [];

    if (brouillons > 0) {
      alertes.push({ nb: brouillons, libelle: 'réception(s) en brouillon à finaliser' });
    }

    if (partielles > 0) {
      alertes.push({ nb: partielles, libelle: 'réception(s) partielles à contrôler' });
    }

    if (annulees > 0) {
      alertes.push({ nb: annulees, libelle: 'réception(s) annulées détectées' });
    }

    if (sansCommande > 0) {
      alertes.push({ nb: sansCommande, libelle: 'réception(s) directes sans commande liée' });
    }

    this.alertes.set(alertes);
  }



printBonReception(): void {
  const selected = this.selectedReception();
  if (!selected) return;

  const doc = new jsPDF('p', 'mm', 'a4');

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const toNumber = (v: any): number => {
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
  };

  const cleanPdf = (value: any): string =>
    String(value ?? '-')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\u202F|\u00A0/g, ' ')
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"');

  const fc = (v: any): string =>
    new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })
      .format(toNumber(v))
      .replace(/\u202F|\u00A0/g, ' ');

  const usd = (v: any): string =>
    new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
      .format(toNumber(v))
      .replace(/\u202F|\u00A0/g, ' ');

  const taux = toNumber(selected.tauxChangeUtilise ?? 0);

  const convUsd = (fcValue: number): number =>
    taux > 0 ? Number((toNumber(fcValue) / taux).toFixed(2)) : 0;

  const lignes = selected.lignes ?? [];

  const marchFc = toNumber(selected.montantMarchandiseFc ?? selected.totalMarchandise);
  const marchUsd = toNumber(selected.montantMarchandiseUsd ?? convUsd(marchFc));

  const fraisFc = toNumber(selected.montantFraisFc ?? selected.totalFrais);
  const fraisUsd = toNumber(selected.montantFraisUsd ?? convUsd(fraisFc));

  const totalFc = toNumber(selected.montantTotalFc ?? selected.totalGeneral);
  const totalUsd = toNumber(selected.montantTotalUsd ?? convUsd(totalFc));

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(cleanPdf('KING POS'), 14, 10);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(cleanPdf('ERP / Gestion commerciale & logistique'), 14, 16);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(cleanPdf('BON DE RECEPTION'), 196, 10, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(cleanPdf('Reception fournisseur / Entree en stock'), 196, 16, { align: 'right' });

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 32, 182, 36, 2, 2, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(cleanPdf('Informations generales'), 18, 39);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  doc.text(cleanPdf(`Reference : ${selected.refReception || '-'}`), 18, 47);
  doc.text(
    cleanPdf(`Date : ${selected.dateReception ? new Date(selected.dateReception).toLocaleDateString('fr-FR') : '-'}`),
    18,
    54
  );
  doc.text(cleanPdf(`Statut : ${selected.statut || '-'}`), 18, 61);

  doc.text(cleanPdf(`Fournisseur : ${selected.fournisseurNom || '-'}`), 105, 47);
  doc.text(cleanPdf(`Depot : ${selected.depotNom || '-'}`), 105, 54);
  doc.text(cleanPdf(`Taux : ${fc(taux)} FC / 1 USD`), 105, 61);

  const drawKpi = (
    x: number,
    title: string,
    fcValue: number,
    usdValue: number
  ) => {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, 75, 56, 22, 2, 2, 'F');

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(cleanPdf(title), x + 3, 81);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.text(cleanPdf(`${fc(fcValue)} FC`), x + 3, 87);

    doc.setTextColor(37, 99, 235);
    doc.setFontSize(7);
    doc.text(cleanPdf(`${usd(usdValue)} USD`), x + 3, 92);
  };

  drawKpi(14, 'MARCHANDISE', marchFc, marchUsd);
  drawKpi(77, 'FRAIS', fraisFc, fraisUsd);
  drawKpi(140, 'TOTAL GENERAL', totalFc, totalUsd);

  autoTable(doc, {
    startY: 105,
    head: [[
      cleanPdf('Produit'),
      cleanPdf('Qte'),
      cleanPdf('Prix achat'),
      cleanPdf('Montant'),
      cleanPdf('Frais'),
      cleanPdf('Cout final')
    ]],
    body: lignes.map((l: any) => {
      const prixFc = toNumber(l.prixAchatUnitaireFc ?? l.prixAchatUnitaire);
      const prixUsd = toNumber(l.prixAchatUnitaireUsd ?? convUsd(prixFc));

      const montantFc = toNumber(l.montantLigneFc ?? l.montantAchat);
      const montantUsd = toNumber(l.montantLigneUsd ?? convUsd(montantFc));

      const fraisLigneFc = toNumber(l.partFraisFc ?? l.partFrais);
      const fraisLigneUsd = toNumber(l.partFraisUsd ?? convUsd(fraisLigneFc));

      const coutFc = toNumber(l.coutUnitaireFinalFc ?? l.coutUnitaireFinal);
      const coutUsd = toNumber(l.coutUnitaireFinalUsd ?? convUsd(coutFc));

      return [
        cleanPdf(l.produitNom || '-'),
        cleanPdf(fc(l.quantiteRecue)),
        [cleanPdf(`${fc(prixFc)} FC`), cleanPdf(`${usd(prixUsd)} USD`)],
        [cleanPdf(`${fc(montantFc)} FC`), cleanPdf(`${usd(montantUsd)} USD`)],
        [cleanPdf(`${fc(fraisLigneFc)} FC`), cleanPdf(`${usd(fraisLigneUsd)} USD`)],
        [cleanPdf(`${fc(coutFc)} FC`), cleanPdf(`${usd(coutUsd)} USD`)]
      ];
    }),
    theme: 'grid',
    margin: { left: 10, right: 10 },
    styles: {
      font: 'helvetica',
      fontSize: 7,
      cellPadding: 2.3,
      overflow: 'linebreak',
      valign: 'middle',
      minCellHeight: 10,
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
      textColor: [15, 23, 42]
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 15, halign: 'right' },
      2: { cellWidth: 31, halign: 'right' },
      3: { cellWidth: 32, halign: 'right' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 33, halign: 'right' }
    },
    didParseCell: (data: any) => {
      if (data.section === 'body' && Array.isArray(data.cell.raw)) {
        data.cell.text = data.cell.raw;
        data.cell.styles.fontSize = 7;
        data.cell.styles.valign = 'middle';
      }
    },
    didDrawPage: () => {
      const pageNumber = doc.getCurrentPageInfo().pageNumber;

      doc.setDrawColor(226, 232, 240);
      doc.line(14, pageHeight - 15, 196, pageHeight - 15);

      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(cleanPdf('Document genere automatiquement par KING POS ERP'), 14, pageHeight - 8);
      doc.text(cleanPdf(`Page ${pageNumber}`), 196, pageHeight - 8, { align: 'right' });
    }
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 140;
  const blockY = finalY + 8;

  if (blockY < 238) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(108, blockY, 88, 42, 2, 2, 'F');

    const totalLine = (
      label: string,
      fcValue: number,
      usdValue: number,
      y: number,
      important = false
    ) => {
      doc.setFont('helvetica', important ? 'bold' : 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(cleanPdf(label), 112, y);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(important ? 37 : 15, important ? 99 : 23, important ? 235 : 42);
      doc.text(cleanPdf(`${fc(fcValue)} FC`), 192, y, { align: 'right' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(37, 99, 235);
      doc.text(cleanPdf(`${usd(usdValue)} USD`), 192, y + 5, { align: 'right' });
    };

    totalLine('Marchandise', marchFc, marchUsd, blockY + 9);
    totalLine('Frais', fraisFc, fraisUsd, blockY + 21);
    totalLine('Total general', totalFc, totalUsd, blockY + 33, true);

    const signY = blockY + 58;

    if (signY < 270) {
      doc.setTextColor(71, 85, 105);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      doc.text(cleanPdf('Receptionne par'), 20, signY);
      doc.line(20, signY + 18, 75, signY + 18);

      doc.text(cleanPdf('Controle par'), 78, signY);
      doc.line(78, signY + 18, 133, signY + 18);

      doc.text(cleanPdf('Cachet / Validation'), 138, signY);
      doc.rect(138, signY + 2, 45, 25);
    }
  }

  doc.save(cleanPdf(`bon-reception-${selected.refReception || selected.id}.pdf`));
}

private getToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

private getThreeMonthsAgo(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setMonth(date.getMonth() - 3);
  return date;
}

filterForm: FormGroup = this.fb.group({
  statut: [null],
  keyword: [''],
  dateDebut: [this.getThreeMonthsAgo()],
  dateFin: [this.getToday()],
  fournisseur: [''],
  depot: [''],
  refCommande: [''],
  valides: [false],
  brouillons: [false],
  partielles: [false],
  annulees: [false],
  avecCommande: [false],
  sansCommande: [false],
  vingtDernieres: [false]
});

resetFilters(): void {
  this.filterForm.reset({
    statut: null,
    keyword: '',
    dateDebut: this.getThreeMonthsAgo(),
    dateFin: this.getToday(),
    fournisseur: '',
    depot: '',
    refCommande: '',
    valides: false,
    brouillons: false,
    partielles: false,
    annulees: false,
    avecCommande: false,
    sansCommande: false,
    vingtDernieres: false
  });

  const first = this.filteredReceptions()[0] ?? null;
  this.selectedReception.set(first);
}


private normalizeDateOnly(value: Date | string | null | undefined): number | null {
  if (!value) return null;

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

private normalizeEndDate(value: Date | string | null | undefined): number | null {
  if (!value) return null;

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  d.setHours(23, 59, 59, 999);
  return d.getTime();
}


formatFc(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

formatUsd(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

getMarchandiseFc(row: any): number {
  return Number(row?.montantMarchandiseFc ?? row?.totalMarchandise ?? 0);
}

getMarchandiseUsd(row: any): number {
  return Number(row?.montantMarchandiseUsd ?? 0);
}

getFraisFc(row: any): number {
  return Number(row?.montantFraisFc ?? row?.totalFrais ?? 0);
}

getFraisUsd(row: any): number {
  return Number(row?.montantFraisUsd ?? 0);
}

getTotalFc(row: any): number {
  return Number(row?.montantTotalFc ?? row?.totalGeneral ?? 0);
}

getTotalUsd(row: any): number {
  return Number(row?.montantTotalUsd ?? 0);
}

totalMarchandiseUsd = computed(() =>
  this.filteredReceptions().reduce((sum, r) => sum + this.getMarchandiseUsd(r), 0)
);

totalFraisUsd = computed(() =>
  this.filteredReceptions().reduce((sum, r) => sum + this.getFraisUsd(r), 0)
);

totalGeneralUsd = computed(() =>
  this.filteredReceptions().reduce((sum, r) => sum + this.getTotalUsd(r), 0)
);
}
