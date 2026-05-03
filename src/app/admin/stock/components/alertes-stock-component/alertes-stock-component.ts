import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { StatutPeremption } from '../../models/statut-peremption.enum';
import { PeremptionStore } from '../../service/peremption-service/peremption.store';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-alertes-stock-component',
  templateUrl: './alertes-stock-component.html',
  styleUrl: './alertes-stock-component.css',
  standalone:false
})
export class AlertesStockComponent implements OnInit {
  readonly store = inject(PeremptionStore);

  // filtres UI
  readonly recherche = signal('');
  readonly filtreProduit = signal('');
  readonly filtreStatut = signal('');
  readonly uniquementDisponibles = signal(true);

  readonly statuts: StatutPeremption[] = [
    StatutPeremption.VALIDE,
    StatutPeremption.PROCHE_EXPIRATION,
    StatutPeremption.ALERTE_170_JOURS
    , StatutPeremption.ALERTE_350_JOURS,
    StatutPeremption.ALERTE_30_JOURS,
    StatutPeremption.ALERTE_7_JOURS,
    StatutPeremption.EXPIRE_AUJOURD_HUI,
    StatutPeremption.PERIME
  ];

  // données exposées au template
  readonly dashboard = computed(() => this.store.dashboard());
  readonly lots = computed(() => this.store.filteredLots());
  readonly alertes = computed(() => this.store.filteredAlertes());

  readonly loading = computed(() => this.store.loading());
  readonly loadingLots = computed(() => this.store.loadingLots());
  readonly loadingAlertes = computed(() => this.store.loadingAlertes());
  readonly loadingDashboard = computed(() => this.store.loadingDashboard());
  readonly recalculLoading = computed(() => this.store.recalculLoading());

  readonly totalLots = computed(() => this.store.totalLots());
  readonly totalLotsGlobal = computed(() => this.store.totalLotsGlobal());
  readonly totalAlertes = computed(() => this.store.totalAlertes());
  readonly totalAlertesGlobal = computed(() => this.store.totalAlertesGlobal());
  readonly totalLotsPerimes = computed(() => this.store.totalLotsPerimes());
  readonly totalLotsValides = computed(() => this.store.totalLotsValides());
  readonly totalLotsAlerte = computed(() => this.store.totalLotsAlerte());

  readonly alertesAffichees = computed(() => this.alertes().slice(0, 5));


displayedColumns: string[] = [
  'produitNom',
  'depotNom',
  'quantiteDisponible',
  'datePeremption',
  'joursRestants',
  'statutPeremption',
  'tauxChangeUtilise',
  'coutUnitaireFinal',
  'valeurLot',
  'referenceDocument'
];



totalValeurLotsUsd(): number {
  return this.lots().reduce((sum, row) => sum + this.getValeurLotUsd(row), 0);
}

totalValeurLotsFc(): number {
  return this.lots().reduce((sum, row) => sum + this.getValeurLotFc(row), 0);
}

formatMoney(value: number | string | null | undefined, digits = 2): string {
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

formatDatePdf(value: string | Date | null | undefined): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';

  return d.toLocaleDateString('fr-FR').replace(/\u202F|\u00A0/g, ' ');
}

excelBorder(): Partial<ExcelJS.Borders> {
  return {
    top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
    right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
  };
}

async exportExcel(): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Péremptions');

  worksheet.mergeCells('A1:K1');
  const title = worksheet.getCell('A1');
  title.value = 'RAPPORT DES LOTS EN PÉREMPTION';
  title.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };

  worksheet.addRow([]);

  worksheet.addRow([
    'Produit',
    'Dépôt',
    'Qté disponible',
    'Date entrée',
    'Date péremption',
    'Jours restants',
    'Statut',
    'Taux',
    'Coût USD',
    'Coût FC',
    'Valeur lot USD',
    'Valeur lot FC',
    'Référence'
  ]);

  const header = worksheet.getRow(3);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.alignment = { horizontal: 'center', vertical: 'middle' };
  header.height = 24;

  header.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF305496' } };
    cell.border = this.excelBorder();
  });

  this.lots().forEach(row => {
    worksheet.addRow([
      row.produitNom ?? '',
      row.depotNom ?? '',
      Number(row.quantiteDisponible ?? 0),
      row.dateEntree ? new Date(row.dateEntree) : '',
      row.datePeremption ? new Date(row.datePeremption) : '',
      Number(row.joursRestants ?? 0),
      this.getStatutLabel(row.statutPeremption),
      this.getTaux(row),
      this.getCoutUsd(row),
      this.getCoutFc(row),
      this.getValeurLotUsd(row),
      this.getValeurLotFc(row),
      row.referenceDocument ?? ''
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
    '',
    '',
    '',
    this.totalValeurLotsUsd(),
    this.totalValeurLotsFc(),
    ''
  ]);

  totalRow.font = { bold: true };
  totalRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAF7' } };
    cell.border = this.excelBorder();
  });

  worksheet.columns = [
    { width: 35 },
    { width: 22 },
    { width: 16 },
    { width: 16 },
    { width: 18 },
    { width: 16 },
    { width: 22 },
    { width: 14 },
    { width: 16 },
    { width: 18 },
    { width: 18 },
    { width: 20 },
    { width: 24 }
  ];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 3) {
      row.eachCell((cell, colNumber) => {
        cell.border = this.excelBorder();
        cell.alignment = {
          vertical: 'middle',
          horizontal: colNumber >= 3 && colNumber <= 12 ? 'right' : 'left'
        };

        if ([3, 6, 8, 9, 10, 11, 12].includes(colNumber)) {
          cell.numFmt = '#,##0.00';
        }

        if ([4, 5].includes(colNumber)) {
          cell.numFmt = 'dd/mm/yyyy';
        }
      });
    }
  });

  worksheet.autoFilter = { from: 'A3', to: 'M3' };
  worksheet.views = [{ state: 'frozen', ySplit: 3 }];

  const buffer = await workbook.xlsx.writeBuffer();

  saveAs(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }),
    'rapport-peremptions.xlsx'
  );
}

exportPdf(): void {
  const doc = new jsPDF('landscape', 'mm', 'a4');

  doc.setFontSize(16);
  doc.text('Rapport des Lots en Péremption', 14, 15);

  doc.setFontSize(9);
  doc.text(`Lots affiches : ${this.totalLots()}`, 14, 24);
  doc.text(`Valeur USD : ${this.formatMoney(this.totalValeurLotsUsd())} USD`, 70, 24);
  doc.text(`Valeur FC : ${this.formatMoney(this.totalValeurLotsFc())} FC`, 145, 24);
  doc.text(`Alertes : ${this.totalAlertes()} / ${this.totalAlertesGlobal()}`, 225, 24);

  autoTable(doc, {
    startY: 32,
    head: [[
      'Produit',
      'Depot',
      'Qte',
      'Entree',
      'Peremption',
      'Jours',
      'Statut',
      'Taux',
      'Cout USD',
      'Cout FC',
      'Valeur USD',
      'Valeur FC',
      'Reference'
    ]],
    body: this.lots().map(row => [
      this.cleanPdfText(row.produitNom),
      this.cleanPdfText(row.depotNom),
      this.formatMoney(row.quantiteDisponible, 3),
      this.formatDatePdf(row.dateEntree),
      this.formatDatePdf(row.datePeremption),
      this.formatMoney(row.joursRestants, 0),
      this.cleanPdfText(this.getStatutLabel(row.statutPeremption)),
      this.formatMoney(this.getTaux(row)),
      this.formatMoney(this.getCoutUsd(row)),
      this.formatMoney(this.getCoutFc(row)),
      this.formatMoney(this.getValeurLotUsd(row)),
      this.formatMoney(this.getValeurLotFc(row)),
      this.cleanPdfText(row.referenceDocument)
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
      0: { cellWidth: 35 },
      1: { cellWidth: 22 },
      2: { halign: 'right' },
      5: { halign: 'right' },
      7: { halign: 'right' },
      8: { halign: 'right' },
      9: { halign: 'right' },
      10: { halign: 'right' },
      11: { halign: 'right' }
    }
  });

  doc.save('rapport-peremptions.pdf');
}
  ngOnInit(): void {
    this.store.loadAll();
  }

  refreshAll(): void {
    this.store.refreshAll();
  }

  recalculerStatuts(): void {
    this.store.recalculer();
  }

  appliquerFiltres(): void {
    this.store.setLotFilters({
      recherche: this.recherche(),
      produit: this.filtreProduit(),
      statut: this.filtreStatut(),
      uniquementDisponibles: this.uniquementDisponibles()
    });
  }

  resetFiltres(): void {
    this.recherche.set('');
    this.filtreProduit.set('');
    this.filtreStatut.set('');
    this.uniquementDisponibles.set(true);
    this.store.resetLotFilters();
  }

  afficherTousLesLots(): void {
    this.store.restoreAllLots();
  }

  afficherLotsEnAlerte(): void {
    this.store.showOnlyLotsEnAlerte();
  }

  afficherLotsPerimes(): void {
    this.store.showOnlyLotsPerimes();
  }

  trierParDatePeremptionAsc(): void {
    this.store.sortLots('datePeremption', 'asc');
  }

  trierParDatePeremptionDesc(): void {
    this.store.sortLots('datePeremption', 'desc');
  }

  trierParProduitAsc(): void {
    this.store.sortLots('produitNom', 'asc');
  }

  trierParQuantiteDesc(): void {
    this.store.sortLots('quantiteDisponible', 'desc');
  }

  trierParJoursRestantsAsc(): void {
    this.store.sortLots('joursRestants', 'asc');
  }

  getStatutLabel(statut?: string | null): string {
    switch (statut) {
      case 'PERIME':
        return 'Périmé';
      case 'EXPIRE_AUJOURD_HUI':
        return 'Expire aujourd’hui';
      case 'ALERTE_7_JOURS':
        return 'Alerte 7 jours';
      case 'ALERTE_30_JOURS':
        return 'Alerte 30 jours';
      case 'ALERTE_170_JOURS':
        return 'Alerte 170 jours';
      case 'ALERTE_350_JOURS':
        return 'Alerte 350 jours';
      case 'PROCHE_EXPIRATION':
        return 'Proche expiration';
      default:
        return 'Valide';
    }
  }

  getStatutClass(statut?: string | null): string {
    switch (statut) {
      case 'PERIME':
        return 'status-perime';
      case 'EXPIRE_AUJOURD_HUI':
        return 'status-expire-aujourdhui';
      case 'ALERTE_7_JOURS':
        return 'status-7j';
      case 'ALERTE_30_JOURS':
        return 'status-30j';
      case 'ALERTE_170_JOURS':
        return 'status-170j';
      case 'ALERTE_350_JOURS':
        return 'status-350j';
      case 'PROCHE_EXPIRATION':
        return 'status-proche';
      default:
        return 'status-valide';
    }
  }

  formatJoursRestants(jours?: number | null): string {
    if (jours == null) return '-';
    if (jours < 0) return `Périmé depuis ${Math.abs(jours)} jour(s)`;
    if (jours === 0) return `Expire aujourd’hui`;
    return `${jours} jour(s) restant(s)`;
  }

  onRechercheChange(value: string): void {
    this.recherche.set(value ?? '');
    this.appliquerFiltres();
  }

  onProduitChange(value: string): void {
    this.filtreProduit.set(value ?? '');
    this.appliquerFiltres();
  }

  onStatutChange(value: string): void {
    this.filtreStatut.set(value ?? '');
    this.appliquerFiltres();
  }

  onDisponibiliteChange(value: boolean): void {
    this.uniquementDisponibles.set(!!value);
    this.appliquerFiltres();
  }


  getTaux(row: any): number {
  return Number(row.tauxChangeUtilise ?? row.tauxChange ?? row.taux ?? 0);
}

getCoutFc(row: any): number {
  const fc = Number(row.coutUnitaireFinalFc ?? 0);
  if (fc > 0) return fc;

  return Number(row.coutUnitaireFinal ?? 0);
}

getCoutUsd(row: any): number {
  const usd = Number(row.coutUnitaireFinalUsd ?? 0);
  if (usd > 0) return usd;

  const taux = this.getTaux(row);
  return taux > 0 ? this.getCoutFc(row) / taux : 0;
}

getValeurLotFc(row: any): number {
  const valeur = Number(row.valeurLotFc ?? row.montantLigneFc ?? 0);
  if (valeur > 0) return valeur;

  return Number(row.quantiteDisponible ?? 0) * this.getCoutFc(row);
}

getValeurLotUsd(row: any): number {
  const valeur = Number(row.valeurLotUsd ?? row.montantLigneUsd ?? 0);
  if (valeur > 0) return valeur;

  const taux = this.getTaux(row);
  return taux > 0 ? this.getValeurLotFc(row) / taux : 0;
}
}
