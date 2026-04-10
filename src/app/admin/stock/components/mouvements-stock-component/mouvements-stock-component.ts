import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MouvementStockView } from '../../models/mouvementStockView';
import { ServiceMouvementStockStore } from '../../service/mouvement/ServiceMouvementStockStore';

@Component({
  selector: 'app-mouvements-stock-component',
  templateUrl: './mouvements-stock-component.html',
  styleUrl: './mouvements-stock-component.css',
  standalone: false
})
export class MouvementsStockComponent implements OnInit {
  readonly store = inject(ServiceMouvementStockStore);

  readonly displayedColumns: string[] = [
    'date',
    'produit',
    'codeBarres',
    'depot',
    'typeMouvement',
    'quantite',
    'prixUnitaireEntree',
    'fraisUnitaire',
    'coutUnitaireFinal',
    'ancienStock',
    'nouveauStock',
    'ancienPmp',
    'nouveauPmp',
    'referenceDocument',
    'libelle'
  ];

  readonly loading = this.store.loading;
  readonly mouvements = this.store.mouvements;

  readonly totalItems = this.store.totalItems;
  readonly totalEntrees = this.store.totalEntrees;
  readonly totalSorties = this.store.totalSorties;
  readonly totalQuantiteEntree = this.store.totalQuantiteEntree;
  readonly totalQuantiteSortie = this.store.totalQuantiteSortie;

  readonly search = signal('');
  readonly depotFilter = signal('');
  readonly typeFilter = signal('');
  readonly dateDebut = signal('');
  readonly dateFin = signal('');

  readonly filteredMouvements = computed(() =>
    this.store.filterMouvements(
      this.search(),
      this.depotFilter(),
      this.typeFilter(),
      this.dateDebut(),
      this.dateFin()
    )
  );

  readonly depots = computed(() =>
    [...new Set(this.mouvements().map(m => m.nomDepot).filter(Boolean))]
  );

  readonly types = computed(() =>
    [...new Set(this.mouvements().map(m => m.typeMouvement).filter(Boolean))]
  );

  readonly totalValeurEntree = computed(() =>
    this.filteredMouvements()
      .filter(m => this.isEntree(m.typeMouvement))
      .reduce((sum, m) => {
        const qte = Number(m.quantite ?? 0);
        const cout = Number(m.coutUnitaireFinal ?? 0);
        return sum + (qte * cout);
      }, 0)
  );

  readonly totalValeurSortie = computed(() =>
    this.filteredMouvements()
      .filter(m => this.isSortie(m.typeMouvement))
      .reduce((sum, m) => {
        const qte = Number(m.quantite ?? 0);
        const cout = Number(m.coutUnitaireFinal ?? 0);
        return sum + (qte * cout);
      }, 0)
  );

  ngOnInit(): void {
    this.store.loadIfNeeded().subscribe();
  }

  refresh(): void {
    this.store.refresh().subscribe();
  }

  resetFilters(): void {
    this.search.set('');
    this.depotFilter.set('');
    this.typeFilter.set('');
    this.dateDebut.set('');
    this.dateFin.set('');
  }

  onSearchChange(value: string): void {
    this.search.set(value ?? '');
  }

  onDepotChange(value: string): void {
    this.depotFilter.set(value ?? '');
  }

  onTypeChange(value: string): void {
    this.typeFilter.set(value ?? '');
  }

  onDateDebutChange(value: string): void {
    this.dateDebut.set(value ?? '');
  }

  onDateFinChange(value: string): void {
    this.dateFin.set(value ?? '');
  }

  isEntree(type: string | null | undefined): boolean {
    return (type ?? '').toUpperCase().includes('ENTREE');
  }

  isSortie(type: string | null | undefined): boolean {
    return (type ?? '').toUpperCase().includes('SORTIE');
  }

  getBadgeClass(type: string | null | undefined): string {
    if (this.isEntree(type)) return 'badge-success';
    if (this.isSortie(type)) return 'badge-danger';
    return 'badge-info';
  }

  getTypeLabel(type: string | null | undefined): string {
    const value = (type ?? '').replace(/_/g, ' ').trim();
    return value || '-';
  }

  getVariationClass(type: string | null | undefined): string {
    if (this.isEntree(type)) return 'variation-up';
    if (this.isSortie(type)) return 'variation-down';
    return 'variation-neutral';
  }

  formatNumber(value: number | string | null | undefined, digits = 2): string {
    return Number(value ?? 0).toLocaleString('fr-FR', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
  }

  trackById = (_: number, row: MouvementStockView) => row.id;

  exportExcel(): void {
    const data = this.filteredMouvements().map(m => ({
      Date: m.dateMouvement,
      Produit: m.nomProduit,
      CodeBarres: m.codeBarres,
      Depot: m.nomDepot,
      Type: this.getTypeLabel(m.typeMouvement),
      Quantite: m.quantite,
      PrixUnitaireEntree: m.prixUnitaireEntree,
      FraisUnitaire: m.fraisUnitaire,
      CoutUnitaireFinal: m.coutUnitaireFinal,
      AncienStock: m.ancienStock,
      NouveauStock: m.nouveauStock,
      AncienPmp: m.ancienPmp,
      NouveauPmp: m.nouveauPmp,
      Reference: m.referenceDocument,
      Libelle: m.libelle
    }));

    import('xlsx').then(XLSX => {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'MouvementsStock');
      XLSX.writeFile(workbook, 'mouvements-stock.xlsx');
    });
  }

exportPdf(): void {
  import('jspdf').then(jsPDFModule => {
    const jsPDF = jsPDFModule.default;
    const doc = new jsPDF('l', 'mm', 'a4');

    import('jspdf-autotable').then(autoTableModule => {
      const autoTable = autoTableModule.default;

      const mouvements = this.filteredMouvements();

      const totalMouvements = mouvements.length;
      const totalEntrees = mouvements.filter(m => this.isEntree(m.typeMouvement)).length;
      const totalSorties = mouvements.filter(m => this.isSortie(m.typeMouvement)).length;

      const totalQuantiteEntree = mouvements
        .filter(m => this.isEntree(m.typeMouvement))
        .reduce((sum, m) => sum + Number(m.quantite ?? 0), 0);

      const totalQuantiteSortie = mouvements
        .filter(m => this.isSortie(m.typeMouvement))
        .reduce((sum, m) => sum + Number(m.quantite ?? 0), 0);

      const totalValeurEntree = mouvements
        .filter(m => this.isEntree(m.typeMouvement))
        .reduce((sum, m) => sum + (Number(m.quantite ?? 0) * Number(m.coutUnitaireFinal ?? 0)), 0);

      const totalValeurSortie = mouvements
        .filter(m => this.isSortie(m.typeMouvement))
        .reduce((sum, m) => sum + (Number(m.quantite ?? 0) * Number(m.coutUnitaireFinal ?? 0)), 0);

      const pageWidth = doc.internal.pageSize.getWidth();
      const now = new Date();

      const formatDateTime = (value: string | Date | null | undefined): string => {
        if (!value) return '-';
        const d = new Date(value);
        return d.toLocaleString('fr-FR');
      };

      const drawHeader = () => {
        doc.setFillColor(15, 98, 254);
        doc.rect(0, 0, pageWidth, 22, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('MOUVEMENTS DE STOCK', 14, 14);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Édité le : ${formatDateTime(now)}`, pageWidth - 60, 14);

        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Filtres appliqués', 14, 30);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);

        const periode = `${this.dateDebut() || '-'}  →  ${this.dateFin() || '-'}`;
        const depot = this.depotFilter() || 'Tous';
        const type = this.typeFilter() ? this.getTypeLabel(this.typeFilter()) : 'Tous';
        const recherche = this.search() || '-';

        doc.text(`Période : ${periode}`, 14, 36);
        doc.text(`Dépôt : ${depot}`, 90, 36);
        doc.text(`Type : ${type}`, 150, 36);
        doc.text(`Recherche : ${recherche}`, 210, 36);
      };

      const drawKpiCard = (
        x: number,
        y: number,
        w: number,
        h: number,
        title: string,
        value: string
      ) => {
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(x, y, w, h, 3, 3, 'FD');

        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(title, x + 4, y + 6);

        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(value, x + 4, y + 14);
      };

      drawHeader();

      const kpiY = 42;
      const cardW = 38;
      const cardH = 18;
      const gap = 4;

      drawKpiCard(14, kpiY, cardW, cardH, 'Mouvements', `${totalMouvements}`);
      drawKpiCard(14 + (cardW + gap) * 1, kpiY, cardW, cardH, 'Entrées', `${totalEntrees}`);
      drawKpiCard(14 + (cardW + gap) * 2, kpiY, cardW, cardH, 'Sorties', `${totalSorties}`);
      drawKpiCard(14 + (cardW + gap) * 3, kpiY, cardW, cardH, 'Qté entrée', this.formatNumber(totalQuantiteEntree, 3));
      drawKpiCard(14 + (cardW + gap) * 4, kpiY, cardW, cardH, 'Qté sortie', this.formatNumber(totalQuantiteSortie, 3));
      drawKpiCard(14 + (cardW + gap) * 5, kpiY, cardW, cardH, 'Val. entrée', this.formatNumber(totalValeurEntree, 2));
      drawKpiCard(14 + (cardW + gap) * 6, kpiY, cardW, cardH, 'Val. sortie', this.formatNumber(totalValeurSortie, 2));

      autoTable(doc, {
        startY: 66,
        head: [[
          'Date',
          'Produit',
          'Dépôt',
          'Type',
          'Qté',
          'PU',
          'Frais',
          'Coût final',
          'Stock avant',
          'Stock après',
          'PMP avant',
          'PMP après',
          'Référence',
          'Libellé'
        ]],
        body: mouvements.map(m => [
          formatDateTime(m.dateMouvement),
          `${m.nomProduit ?? ''}${m.codeBarres ? '\n' + m.codeBarres : ''}`,
          m.nomDepot ?? '-',
          this.getTypeLabel(m.typeMouvement),
          this.formatNumber(m.quantite, 3),
          this.formatNumber(m.prixUnitaireEntree, 6),
          this.formatNumber(m.fraisUnitaire, 6),
          this.formatNumber(m.coutUnitaireFinal, 6),
          this.formatNumber(m.ancienStock, 3),
          this.formatNumber(m.nouveauStock, 3),
          this.formatNumber(m.ancienPmp, 6),
          this.formatNumber(m.nouveauPmp, 6),
          m.referenceDocument ?? '-',
          m.libelle ?? '-'
        ]),
        foot: [[
          '',
          '',
          '',
          'TOTAUX',
          this.formatNumber(
            mouvements.reduce((sum, m) => sum + Number(m.quantite ?? 0), 0),
            3
          ),
          '',
          '',
          this.formatNumber(
            mouvements.reduce((sum, m) => sum + Number(m.coutUnitaireFinal ?? 0), 0),
            6
          ),
          '',
          '',
          '',
          '',
          '',
          ''
        ]],
        theme: 'grid',
        styles: {
          fontSize: 7,
          cellPadding: 2,
          overflow: 'linebreak',
          valign: 'middle',
          textColor: [30, 41, 59],
          lineColor: [226, 232, 240],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [15, 98, 254],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        footStyles: {
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        columnStyles: {
          0: { cellWidth: 24 },
          1: { cellWidth: 34 },
          2: { cellWidth: 24 },
          3: { cellWidth: 26 },
          4: { halign: 'right', cellWidth: 16 },
          5: { halign: 'right', cellWidth: 18 },
          6: { halign: 'right', cellWidth: 18 },
          7: { halign: 'right', cellWidth: 20 },
          8: { halign: 'right', cellWidth: 20 },
          9: { halign: 'right', cellWidth: 20 },
          10: { halign: 'right', cellWidth: 18 },
          11: { halign: 'right', cellWidth: 18 },
          12: { cellWidth: 24 },
          13: { cellWidth: 44 }
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 3) {
            const rawType = mouvements[data.row.index]?.typeMouvement ?? '';
            if ((rawType ?? '').includes('ENTREE')) {
              data.cell.styles.textColor = [22, 101, 52];
              data.cell.styles.fontStyle = 'bold';
            } else if ((rawType ?? '').includes('SORTIE')) {
              data.cell.styles.textColor = [153, 27, 27];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
        didDrawPage: (data) => {
          const pageCount = doc.getNumberOfPages();
          const currentPage = data.pageNumber;

          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(
            `Page ${currentPage} / ${pageCount}`,
            pageWidth - 30,
            doc.internal.pageSize.getHeight() - 6
          );

          doc.text(
            'Rapport des mouvements de stock',
            14,
            doc.internal.pageSize.getHeight() - 6
          );
        }
      });

      doc.save('mouvements-stock-sap.pdf');
    });
  });
}
}
