import { Component, computed, OnInit, signal } from '@angular/core';
import { VenteStore } from '../../service/VenteStore';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Toast } from '../../../../shares/services/toast/toast';
import { finalize } from 'rxjs';
import { ConfirmAnnulationVenteDialogComponent } from '../confirm-annulation-vente-dialog-component/confirm-annulation-vente-dialog-component';

@Component({
  selector: 'app-historique-ventes.component',
  templateUrl: './historique-ventes.component.html',
  styleUrl: './historique-ventes.component.css',
  standalone: false
})
export class HistoriqueVentesComponent implements OnInit {
displayedColumns: string[] = [
    'date',
    'ticket',
    'client',
    'paiement',
    'articles',
    'montantRecu',
    'monnaie',
    'total',
    'statut',
    'actions'
  ];

  filterForm: FormGroup;
  expandedSaleId = signal<number | null>(null);
  annulationLoadingIds = signal<number[]>([]);

  constructor(
    public venteStore: VenteStore,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private toastr: Toast
  ) {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.filterForm = this.fb.group({
      search: [''],
      dateDebut: [this.toInputDate(firstDay)],
      dateFin: [this.toInputDate(lastDay)],
      modePaiement: ['']
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.venteStore.loadIfNeeded().subscribe({
      error: (err) => console.error('Erreur chargement ventes', err)
    });
  }

  refresh(): void {
    this.venteStore.refresh().subscribe({
      error: (err) => console.error('Erreur actualisation ventes', err)
    });
  }

  resetFilters(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.filterForm.patchValue({
      search: '',
      dateDebut: this.toInputDate(firstDay),
      dateFin: this.toInputDate(lastDay),
      modePaiement: ''
    });
  }

  ventesFiltrees = computed(() => {
    const items = this.venteStore.items() ?? [];

    const raw = this.filterForm.getRawValue();
    const search = (raw.search || '').toString().toLowerCase().trim();
    const dateDebut = raw.dateDebut;
    const dateFin = raw.dateFin;
    const modePaiement = (raw.modePaiement || '').toString().trim();

    const start = dateDebut ? new Date(dateDebut + 'T00:00:00') : null;
    const end = dateFin ? new Date(dateFin + 'T23:59:59') : null;

    return items
      .filter((v: any) => {
        const venteDate = v?.dateVente ? new Date(v.dateVente) : null;
        if (!venteDate) return false;

        if (start && venteDate < start) return false;
        if (end && venteDate > end) return false;
        if (modePaiement && v?.modePaiement !== modePaiement) return false;

        if (search) {
          const content = [
            v?.ticketNumero,
            v?.clientNom,
            v?.caissier,
            v?.modePaiement,
            v?.statut,
            ...(v?.lignes || []).map((l: any) => l?.produitNom)
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          if (!content.includes(search)) return false;
        }

        return true;
      })
      .sort(
        (a: any, b: any) =>
          new Date(b.dateVente).getTime() - new Date(a.dateVente).getTime()
      );
  });

  totalVentes = computed(() => this.ventesFiltrees().length);

  totalMontant = computed(() =>
    this.ventesFiltrees().reduce(
      (sum: number, v: any) => sum + Number(v?.totalGeneral || 0),
      0
    )
  );

  totalArticles = computed(() =>
    this.ventesFiltrees().reduce((sum: number, v: any) => {
      const qty = (v?.lignes || []).reduce(
        (s: number, l: any) => s + Number(l?.quantite || 0),
        0
      );
      return sum + qty;
    }, 0)
  );

  panierMoyen = computed(() => {
    const count = this.totalVentes();
    return count > 0 ? this.totalMontant() / count : 0;
  });

  totalAnnulees = computed(() =>
    this.ventesFiltrees().filter((v: any) => v?.statut === 'ANNULEE').length
  );

  totalValides = computed(() =>
    this.ventesFiltrees().filter((v: any) => v?.statut !== 'ANNULEE').length
  );

  getLignesCount(vente: any): number {
    return (vente?.lignes || []).length;
  }

  getQuantiteTotale(vente: any): number {
    return (vente?.lignes || []).reduce(
      (sum: number, l: any) => sum + Number(l?.quantite || 0),
      0
    );
  }

  toggleDetails(venteId: number): void {
    this.expandedSaleId.set(this.expandedSaleId() === venteId ? null : venteId);
  }

  isExpanded(venteId: number): boolean {
    return this.expandedSaleId() === venteId;
  }

  reprintTicket(vente: any): void {
    import('jspdf').then((jsPDFModule) => {
      const jsPDF = jsPDFModule.default;

      import('jspdf-autotable').then((autoTableModule: any) => {
        const autoTable = autoTableModule.default;

        const lignes = vente?.lignes || [];
        const devise = vente?.devise || 'USD';

        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [80, 200]
        });

        const pageWidth = 80;
        let y = 8;

        const centerText = (text: string, posY: number, fontSize = 10) => {
          doc.setFontSize(fontSize);
          const textWidth = doc.getTextWidth(text);
          const x = (pageWidth - textWidth) / 2;
          doc.text(text, x, posY);
        };

        const line = (posY: number) => {
          doc.setDrawColor(120);
          doc.line(4, posY, 76, posY);
        };

        const money = (value: any) => `${this.formatAmount(value)} ${devise}`;

        doc.setFont('helvetica', 'bold');
        centerText('PEACE POS', y, 14);
        y += 5;

        doc.setFont('helvetica', 'normal');
        centerText('Ticket de vente', y, 10);
        y += 5;
        centerText(vente?.ticketNumero || '-', y, 9);
        y += 4;

        line(y);
        y += 5;

        doc.setFontSize(9);
        doc.text(`Date : ${this.formatDateTime(vente?.dateVente)}`, 5, y);
        y += 5;
        doc.text(`Client : ${vente?.clientNom || 'CLIENT DIVERS'}`, 5, y);
        y += 5;
        doc.text(`Caissier : ${vente?.caissier || '-'}`, 5, y);
        y += 5;
        doc.text(`Paiement : ${vente?.modePaiement || '-'}`, 5, y);
        y += 5;
        doc.text(`Statut : ${this.getStatutLabel(vente?.statut)}`, 5, y);
        y += 5;

        line(y);
        y += 3;

        const body = lignes.map((ligne: any) => [
          ligne?.produitNom || '-',
          String(ligne?.quantite || 0),
          this.formatAmount(ligne?.prixUnitaire),
          this.formatAmount(ligne?.totalLigne)
        ]);

        autoTable(doc, {
          startY: y,
          head: [['Article', 'Qté', 'PU', 'Total']],
          body,
          theme: 'plain',
          styles: {
            fontSize: 8,
            cellPadding: 1.2
          },
          headStyles: {
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { cellWidth: 34 },
            1: { cellWidth: 10, halign: 'center' },
            2: { cellWidth: 12, halign: 'right' },
            3: { cellWidth: 16, halign: 'right' }
          },
          margin: { left: 4, right: 4 }
        });

        const finalY = (doc as any).lastAutoTable?.finalY ?? y + 20;
        y = finalY + 4;

        line(y);
        y += 5;

        doc.setFontSize(9);
        doc.text('Sous-total', 5, y);
        doc.text(money(this.safeSousTotal(vente)), 75, y, { align: 'right' });
        y += 5;

        doc.text('Remise', 5, y);
        doc.text(money(vente?.totalRemise), 75, y, { align: 'right' });
        y += 5;

        doc.setFont('helvetica', 'bold');
        doc.text('Total', 5, y);
        doc.text(money(this.safeTotalGeneral(vente)), 75, y, { align: 'right' });
        y += 5;

        doc.setFont('helvetica', 'normal');
        doc.text('Montant reçu', 5, y);
        doc.text(money(vente?.montantRecu), 75, y, { align: 'right' });
        y += 5;

        doc.text('Monnaie', 5, y);
        doc.text(money(vente?.monnaie), 75, y, { align: 'right' });
        y += 7;

        line(y);
        y += 6;

        centerText('Merci pour votre achat', y, 9);
        y += 5;
        centerText(`Imprimé le ${this.formatDateTime(new Date())}`, y, 8);

        doc.save(`ticket-${vente?.ticketNumero || vente?.id || 'vente'}.pdf`);
      });
    });
  }

  formatAmount(value: any): string {
    return Number(value || 0).toFixed(2);
  }

  formatDateTime(value: any): string {
    if (!value) return '-';

    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return '-';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }

  safeTotalGeneral(vente: any): number {
    const total = Number(vente?.totalGeneral || 0);
    if (total > 0) return total;

    return (vente?.lignes || []).reduce(
      (sum: number, ligne: any) => sum + Number(ligne?.totalLigne || 0),
      0
    );
  }

  safeSousTotal(vente: any): number {
    const sousTotal = Number(vente?.sousTotal || 0);
    if (sousTotal > 0) return sousTotal;

    return (vente?.lignes || []).reduce(
      (sum: number, ligne: any) =>
        sum + (Number(ligne?.prixUnitaire || 0) * Number(ligne?.quantite || 0)),
      0
    );
  }

  private toInputDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  isAnnulationLoading(id: number): boolean {
    return this.annulationLoadingIds().includes(id);
  }

  private addLoadingId(id: number): void {
    if (this.isAnnulationLoading(id)) return;
    this.annulationLoadingIds.set([...this.annulationLoadingIds(), id]);
  }

  private removeLoadingId(id: number): void {
    this.annulationLoadingIds.set(
      this.annulationLoadingIds().filter(x => x !== id)
    );
  }

  isVenteAnnulable(vente: any): boolean {
    return !!vente && vente.statut !== 'ANNULEE' && !this.isAnnulationLoading(vente.id);
  }

  getStatutLabel(statut: string | null | undefined): string {
    return statut === 'ANNULEE' ? 'Annulée' : 'Validée';
  }

  getStatutClass(statut: string | null | undefined): string {
    return statut === 'ANNULEE'
      ? 'status-badge annulee'
      : 'status-badge valide';
  }
openAnnulationDialog(vente: any): void {
  if (!vente?.id) {
    this.toastr.error('Vente introuvable.');
    return;
  }

  const dialogRef = this.dialog.open(ConfirmAnnulationVenteDialogComponent, {
    width: '520px',
    disableClose: true,
    panelClass: 'pos-dialog-panel',
    data: {
      ticketNumero: vente.ticketNumero,
      clientNom: vente.clientNom,
      totalTTC: vente.totalGeneral ?? vente.totalTTC ?? 0,
      devise: vente.devise || 'USD'
    }
  });

  dialogRef.afterClosed().subscribe((result) => {
    if (!result?.confirmed) {
      return;
    }

    const commentaire = (result.commentaire || '').trim();

    if (!commentaire) {
      this.toastr.warning('Le commentaire d’annulation est obligatoire.');
      return;
    }

    this.setAnnulationLoading(vente.id, true);

    this.venteStore.annulerVente(vente.id, commentaire).subscribe({
      next: (res) => {
        if (res) {
          this.toastr.success('Retour de vente enregistré avec succès.');
        } else {
          this.toastr.error('Le retour de vente a échoué.');
        }
      },
      error: (err) => {
        console.error(err);
        this.toastr.error(
          err?.error?.message || 'Erreur lors du retour de vente.'
        );
      },
      complete: () => {
        this.setAnnulationLoading(vente.id, false);
      }
    });
  });
}



setAnnulationLoading(id: number, loading: boolean): void {
  if (loading) {
    this.annulationLoadingIds.update((ids) =>
      ids.includes(id) ? ids : [...ids, id]
    );
  } else {
    this.annulationLoadingIds.update((ids) =>
      ids.filter((item) => item !== id)
    );
  }
}


formatFC(value: number | null | undefined): string {
  return `${this.toNumber(value).toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })} FC`;
}

formatUSD(value: number | null | undefined): string {
  return `${this.toNumber(value).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} USD`;
}

toNumber(value: any): number {
  if (value === null || value === undefined || value === '') return 0;
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}

getVenteFC(v: any, field: string): number {
  return this.toNumber(
    v?.[`${field}CDF`] ??
    v?.[`${field}Fc`] ??
    v?.[field] ??
    0
  );
}

getVenteUSD(v: any, field: string): number {
  return this.toNumber(
    v?.[`${field}USD`] ??
    v?.[`${field}Usd`] ??
    0
  );
}

getLigneFC(ligne: any, field: string): number {
  if (field === 'prix') {
    return this.toNumber(ligne?.prixCDF ?? ligne?.prixUnitaireCDF ?? ligne?.prixUnitaire ?? ligne?.prix ?? 0);
  }

  if (field === 'remise') {
    return this.toNumber(ligne?.remiseCDF ?? ligne?.remise ?? 0);
  }

  if (field === 'total') {
    return this.toNumber(ligne?.totalCDF ?? ligne?.totalLigneCDF ?? ligne?.totalLigne ?? ligne?.total ?? 0);
  }

  return 0;
}

getLigneUSD(ligne: any, field: string): number {
  if (field === 'prix') {
    return this.toNumber(ligne?.prixUSD ?? ligne?.prixUnitaireUSD ?? 0);
  }

  if (field === 'remise') {
    return this.toNumber(ligne?.remiseUSD ?? 0);
  }

  if (field === 'total') {
    return this.toNumber(ligne?.totalUSD ?? ligne?.totalLigneUSD ?? 0);
  }

  return 0;
}

totalMontantUSD(): number {
  return this.ventesFiltrees()
    .reduce((sum: number, v: any) => sum + this.getVenteUSD(v, 'totalGeneral'), 0);
}

panierMoyenUSD(): number {
  const total = this.totalVentes();
  if (!total) return 0;
  return this.totalMontantUSD() / total;
}
}
