import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ReceptionAchatStore } from '../../service/reception/ReceptionAchatStore';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReceptionAchatResponse } from '../../models/reception-achat.model';
import { FormBuilder, FormGroup } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
    console.log('Export Excel réceptions');
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

  const primary = '#0f172a';
  const secondary = '#475569';
  const lightBg = '#f8fafc';
  const accent = '#2563eb';
const formatMoney = (value: any, devise: string = 'USD'): string => {
  const number = Number(value || 0);

  const formatted = number
    .toFixed(2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  return `${formatted} ${devise}`;
};
  const formatDate = (value: any): string => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('fr-FR');
  };

  const lignes = selected.lignes ?? [];

  // HEADER
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('BON DE RÉCEPTION', 14, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Réception fournisseur / Entrée en stock', 14, 19);

  // Bloc info document
  doc.setTextColor(15, 23, 42);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 34, 182, 34, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Informations générales', 18, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  doc.text(`Référence : ${selected.refReception || '-'}`, 18, 50);
  doc.text(`Date réception : ${formatDate(selected.dateReception)}`, 18, 57);
  doc.text(`Statut : ${selected.statut || '-'}`, 18, 64);

  doc.text(`Fournisseur : ${selected.fournisseurNom || '-'}`, 105, 50);
  doc.text(`Dépôt : ${selected.depotNom || '-'}`, 105, 57);
  doc.text(`Commande liée : ${selected.refCommande || '-'}`, 105, 64);

  // KPI
  const boxY = 76;
  const boxW = 56;
  const gap = 7;

  const drawKpi = (x: number, title: string, value: string) => {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, boxY, boxW, 22, 3, 3, 'F');

    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(title, x + 4, boxY + 7);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.text(value, x + 4, boxY + 15);
  };

  drawKpi(14, 'MARCHANDISE', formatMoney(selected.totalMarchandise));
  drawKpi(14 + boxW + gap, 'FRAIS', formatMoney(selected.totalFrais));
  drawKpi(14 + (boxW + gap) * 2, 'TOTAL GÉNÉRAL', formatMoney(selected.totalGeneral));

  // TABLE
  autoTable(doc, {
    startY: 106,
    head: [[
      'Produit',
      'Catégorie',
      'Qté reçue',
      'Prix achat',
      'Montant achat',
      'Part frais',
      'Coût final'
    ]],
    body: lignes.map((l: any) => [
      l.produitNom || '-',
      l.categorieNom || '-',
      formatMoney(l.quantiteRecue),
      formatMoney(l.prixAchatUnitaire),
      formatMoney(l.montantAchat),
      formatMoney(l.partFrais),
      formatMoney(l.coutUnitaireFinal)
    ]),
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      textColor: primary,
      lineColor: '#e2e8f0',
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' }
    },
    margin: { left: 14, right: 14 }
  });

  const finalY = (doc as any).lastAutoTable.finalY || 120;

  // Totaux
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(116, finalY + 8, 80, 26, 3, 3, 'F');

  doc.setTextColor(secondary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Sous-total marchandise', 120, finalY + 16);
  doc.text('Total frais', 120, finalY + 23);
  doc.text('Total général', 120, finalY + 30);

  doc.setTextColor(15, 23, 42);
  doc.text(formatMoney(selected.totalMarchandise), 192, finalY + 16, { align: 'right' });
  doc.text(formatMoney(selected.totalFrais), 192, finalY + 23, { align: 'right' });

  doc.setTextColor(37, 99, 235);
  doc.setFont('helvetica', 'bold');
  doc.text(formatMoney(selected.totalGeneral), 192, finalY + 30, { align: 'right' });

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(226, 232, 240);
  doc.line(14, pageHeight - 15, 196, pageHeight - 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Document généré par le module Achats / Réceptions', 14, pageHeight - 8);
  doc.text(`Imprimé le ${new Date().toLocaleDateString('fr-FR')}`, 196, pageHeight - 8, { align: 'right' });

  doc.save(`bon-reception-${selected.refReception || selected.id}.pdf`);
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
}
