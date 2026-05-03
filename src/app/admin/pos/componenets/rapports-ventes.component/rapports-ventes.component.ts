import { AfterViewInit, Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {  RapportVenteDetailResponse, RapportVenteFilterRequest } from '../../../produits/models/rapport-vente-pos.model';
import { RapportVentePosStore } from '../../service/RapportVentePosStore';

@Component({
  selector: 'app-rapports-ventes.component',
  templateUrl: './rapports-ventes.component.html',
  styleUrl: './rapports-ventes.component.css',
  standalone: false
})
export class RapportsVentesComponent implements  OnInit, AfterViewInit {
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
    'serviceCredite',
    'module',
    'natureOperation',
    'numeroCC',
    'dateCC',
    'typeCommandeOuOR',
    'libelleType',
    'numeroClient',
    'nomClient',
    'codeRemise',
    'tarif',
    'operateur',
    'quantiteCommandee',
    'quantiteFacturee',
    'userQuiALivre',
    'numeroBL',
    'dateBL',
    'userQuiAFacture',
    'numeroFacture',
    'dateFacture',
    'positionFacture',
    'numeroBonCommande',
    'libelleCommandeOuOR',
    'numeroLigne',
    'cst',
    'reference',
    'designation',
    'codeRemiseLigne',
    'codeGestion',
    'geree',
    'coursDevise',
    'prixBrut',
    'remise',
    'prixNet',
    'pmp',
    'totalNet',
    'totalPmp',
    'marge',
    'pourcentageMarge',
    'tauxTva',
    'totalTtc'
  ];

  resumeCards = computed(() => {
    const t = this.totalGeneral();

    return [
      {
        title: 'Total net USD',
        value: t?.totalNet ?? 0,
        suffix: 'USD',
        icon: 'payments'
      },
      {
        title: 'Total PMP USD',
        value: t?.totalPmp ?? 0,
        suffix: 'USD',
        icon: 'inventory_2'
      },
      {
        title: 'Marge USD',
        value: t?.marge ?? 0,
        suffix: 'USD',
        icon: 'trending_up'
      },
      {
        title: 'Marge %',
        value: t?.pourcentageMarge ?? 0,
        suffix: '%',
        icon: 'percent'
      }
    ];
  });

  ngOnInit(): void {
    this.configureFilter();
    this.loadRapport();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
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

  exportExcel(): void {
    const kpiRows = [
      ...this.kpis(),
      ...(this.totalGeneral() ? [this.totalGeneral()!] : [])
    ].map(x => ({
      Cst: x.cst,
      'Total net': x.totalNet,
      'Total PMP': x.totalPmp,
      Marge: x.marge,
      'Total net CDF': x.totalNetCDF,
      'Total PMP CDF': x.totalPmpCDF,
      'Marge CDF': x.margeCDF,
      '% Marge': x.pourcentageMarge
    }));

    const detailRows = this.dataSource.data.map(x => ({
      Succursale: x.succursale,
      'Service crédité': x.serviceCredite,
      Module: x.module,
      'Nature opération': x.natureOperation,
      'N° CC': x.numeroCC,
      'Date CC': this.formatDate(x.dateCC),
      'Type cde / OR': x.typeCommandeOuOR,
      'Libellé type': x.libelleType,
      'N° Client': x.numeroClient,
      'Nom Client': x.nomClient,
      'Code remise': x.codeRemise,
      Tarif: x.tarif,
      Opérateur: x.operateur,
      'Qté cdée': x.quantiteCommandee,
      'Qté facturée': x.quantiteFacturee,
      'user qui a livré': x.userQuiALivre,
      'N° BL': x.numeroBL,
      'Date BL': this.formatDate(x.dateBL),
      'user qui a facturé': x.userQuiAFacture,
      'N° facture': x.numeroFacture,
      'Date facture': this.formatDate(x.dateFacture),
      'Position facture': x.positionFacture,
      'N° Bon de cde': x.numeroBonCommande,
      'Libellé cde / OR': x.libelleCommandeOuOR,
      'N° ligne': x.numeroLigne,
      cst: x.cst,
      Référence: x.reference,
      Désignation: x.designation,
      'code Remise': x.codeRemiseLigne,
      'Code gestion': x.codeGestion,
      "Gérée '0=NON ; 1=OUI)": x.geree,
      'Cours devise': x.coursDevise,
      'Prix brut': x.prixBrut,
      Remise: x.remise,
      'Prix net': x.prixNet,
      PMP: x.pmp,
      'Total NET': x.totalNet,
      'Total PMP': x.totalPmp,
      Marge: x.marge,
      '% Marge': x.pourcentageMarge,
      'Taux TVA': x.tauxTva,
      'Total TTC': x.totalTtc
    }));

    const wb = XLSX.utils.book_new();

    const wsKpi = XLSX.utils.json_to_sheet(kpiRows);
    const wsDetails = XLSX.utils.json_to_sheet(detailRows);

    XLSX.utils.book_append_sheet(wb, wsKpi, 'KPI');
    XLSX.utils.book_append_sheet(wb, wsDetails, 'Details');

    XLSX.writeFile(wb, `rapport-ventes-pos-${Date.now()}.xlsx`);
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
        'Total net',
        'Total PMP',
        'Marge',
        'Total net CDF',
        'Total PMP CDF',
        'Marge CDF',
        '% Marge'
      ]],
      body: [
        ...this.kpis(),
        ...(this.totalGeneral() ? [this.totalGeneral()!] : [])
      ].map(x => [
        x.cst,
        this.money(x.totalNet),
        this.money(x.totalPmp),
        this.money(x.marge),
        this.money(x.totalNetCDF),
        this.money(x.totalPmpCDF),
        this.money(x.margeCDF),
        `${this.money(x.pourcentageMarge)} %`
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 215, 0] }
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [[
        'Succursale',
        'Module',
        'Ticket',
        'Date',
        'Client',
        'Opérateur',
        'Qté',
        'Cst',
        'Référence',
        'Désignation',
        'Cours',
        'Prix net',
        'PMP',
        'Total NET',
        'Total PMP',
        'Marge',
        '% Marge',
        'TTC'
      ]],
      body: this.dataSource.data.map(x => [
        x.succursale,
        x.module,
        x.numeroFacture,
        this.formatDate(x.dateFacture),
        x.nomClient,
        x.operateur,
        this.money(x.quantiteFacturee),
        x.cst,
        x.reference,
        x.designation,
        this.money(x.coursDevise),
        this.money(x.prixNet),
        this.money(x.pmp),
        this.money(x.totalNet),
        this.money(x.totalPmp),
        this.money(x.marge),
        `${this.money(x.pourcentageMarge)} %`,
        this.money(x.totalTtc)
      ]),
      styles: { fontSize: 6 },
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 215, 0] }
    });

    doc.save(`rapport-ventes-pos-${Date.now()}.pdf`);
  }

  money(value: number | null | undefined): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value ?? 0));
  }

  formatDate(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    return new Date(value).toLocaleString('fr-FR');
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
}
