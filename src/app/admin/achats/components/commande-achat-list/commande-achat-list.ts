import { ChangeDetectorRef, Component, OnInit, AfterViewInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommandeAchatStore } from '../../service/achat/CommandeAchatStore';
import { FormGroup, FormBuilder, FormArray } from '@angular/forms';
import { CommandeAchatListItem } from '../../models/commande-achat.model';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommandesFournisseursComponent } from '../commandes-fournisseurs-component/commandes-fournisseurs-component';
import { take } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';


import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { VoirDdetilsLignesComponents } from '../voir-ddetils-lignes-components/voir-ddetils-lignes-components';
import {
  BrowserMultiFormatReader,
  IScannerControls
} from '@zxing/browser';
import { ElementRef, ViewChild } from '@angular/core';

export interface CommandeDialogData {
  commandeId?: number;
  mode?: 'create' | 'edit' | 'view';
}

@Component({
  selector: 'app-commande-achat-list',
  templateUrl: './commande-achat-list.html',
  styleUrl: './commande-achat-list.css',
  standalone: false
})
export class CommandeAchatList implements OnInit {



  Valider(): void {
    if (!this.selectedCommande) {
      this.snackBar.open('Aucune commande sélectionnée.', 'Fermer', { duration: 3000 });
      return;
    }

    const statut = (this.selectedCommande.statut || '').toUpperCase();

    if (statut === 'VALIDE' || statut === 'VALIDEE') {
      this.snackBar.open('Cette commande est déjà validée.', 'Fermer', { duration: 3000 });
      return;
    }

    if (statut === 'ANNULE' || statut === 'RECEPTIONNEE') {
      this.snackBar.open(
        'Cette commande ne peut pas être validée dans son état actuel.',
        'Fermer',
        { duration: 3500 }
      );
      return;
    }

    this.loading = true;

    this.commandeAchatStore.valider(this.selectedCommande.id).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Commande validée avec succès.', 'Fermer', {
          duration: 3000
        });
        this.refresh();
      },
      error: (err) => {
        console.error(err);
        this.loading = false;

        this.snackBar.open('Erreur lors de la validation de la commande.', 'Fermer', {
          duration: 3500
        });
      }
    });
  }

  filterForm!: FormGroup;

  services: string[] = ['Achat', 'Magasin', 'Logistique'];
  succursales = [
    { id: 1, nom: 'Lubumbashi' },
    { id: 2, nom: 'Kinshasa' }
  ];

  alertes: Array<{ nb: number; libelle: string }> = [];

  commandes: CommandeAchatListItem[] = [];
  selectedCommande: CommandeAchatListItem | null = null;

  displayedColumns: string[] = [
    'select',
    'prefixe',
    'refCommande',
    'libelle',
    'dateCommande',
    'montantNet',
    'positionCommande',
    'montantBrut',
    'montantTtc',
    'devise',
    'operateur'
  ];

  loading = false;


  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private commandeAchatStore: CommandeAchatStore,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loading = true;
    this.initForm();
    this.loadData();
    this.search();
  }


  ngAfterViewInit(): void {
    this.loading = true;
    this.cdr.detectChanges();
  }

  initForm(): void {
    const { dateDebut, dateFin } = this.getDefaultDateRange();
    this.filterForm = this.fb.group({
      position: [null],
      keyword: [''],
      dateDebut: [dateDebut],
      dateFin: [dateFin],
      fournisseur: [''],
      enCours: [true],
      terminee: [true],
      nonLivre: [false],
      partielLivre: [true],
      livre: [false],
      mesCommandes: [false],
      vingtDerniers: [false]
    });
  }

  loadData(): void {
    this.loadCommandes();
    this.loadAlertes();
  }

  loadCommandes(): void {
    this.loading = true;
    this.commandeAchatStore.loadIfNeeded().subscribe({
      next: (data) => {
        this.commandes = data ?? [];
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  loadAlertes(): void {
    this.alertes = [];
  }

  get totalMontant(): number {
    return this.commandes.reduce((sum, item) => sum + Number(item.montantTotal || 0), 0);
  }

  private normalizeStatut(statut: any): string {
    return String(statut ?? '').trim().toUpperCase();
  }

  get totalPartielLivre(): number {
    return (this.commandes ?? []).filter(item =>
      this.normalizeStatut(item?.statut).includes('PARTIEL')
    ).length;
  }

  get totalEnCours(): number {
    return (this.commandes ?? []).filter(item =>
      ['BROUILLON', 'EN_COURS'].includes(this.normalizeStatut(item?.statut))
    ).length;
  }

  selectRow(row: CommandeAchatListItem): void {
    if (this.selectedCommande?.id === row.id) {
      this.selectedCommande = null;
      return;
    }

    this.selectedCommande = row;
  }

  private formatDate(date: Date | null): string | null {
    if (!date) return null;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  search(): void {

    const formValue = this.filterForm.value;

    const request = {
      ...formValue,
      dateDebut: this.formatDate(formValue.dateDebut),
      dateFin: this.formatDate(formValue.dateFin)
    };
    // Ici tu vas appeler ton store/service
    this.commandeAchatStore.searchLocal(request).subscribe({
      next: () => { },
      error: (err) => {
        console.error(err);
      }
    });

  }

  selectCommande(cmd: any): void {
    this.selectedCommande = cmd;
  }

  isSelected(cmd: any): boolean {
    return this.selectedCommande?.id === cmd?.id;
  }

  DetailLignes(): void {
    if (!this.selectedCommande) {
      this.snackBar.open('Aucune commande sélectionnée.', 'Fermer', { duration: 3000 });
      return;
    }

    this.dialog.open(VoirDdetilsLignesComponents, {
      width: '1400px',
      maxWidth: '98vw',
      height: '92vh',
      panelClass: 'full-dialog',
      disableClose: true,
      autoFocus: false,
      data: {
        commandeId: this.selectedCommande.id
      }
    });
  }

  resetFilters(): void {
    const { dateDebut, dateFin } = this.getDefaultDateRange();
    this.filterForm.reset({
      position: null,
      keyword: '',
      dateDebut: dateDebut,
      dateFin: dateFin,
      fournisseur: '',
      enCours: true,
      terminee: true,
      nonLivre: false,
      partielLivre: true,
      livre: false,
      mesCommandes: false,
      vingtDerniers: false
    });

    this.commandeAchatStore.resetSearch();

  }

  refresh(): void {
    this.loadData();
  }

  createCommande(): void {
    const dialogRef = this.dialog.open(CommandesFournisseursComponent, {
      width: '1400px',
      maxWidth: '98vw',
      height: '92vh',
      panelClass: 'full-dialog',
      disableClose: true,
      data: {
        mode: 'create'
      },
      autoFocus: false
    });

    dialogRef.afterClosed()
      .pipe(take(1))
      .subscribe((created: boolean | any) => {
        if (created) {
          this.refresh();
        }
      });
  }

  editCommande(): void {

    if (this.selectedCommande?.statut === 'VALIDEE') {
      this.snackBar.open('Une commande validée ne peut pas être modifiée.', 'Fermer', { duration: 3500 });
      return;
    }

      if (this.selectedCommande?.statut === 'RECEPTIONNEE') {
      this.snackBar.open('Une commande réceptionnée ne peut pas être modifiée.', 'Fermer', { duration: 3500 });
      return;
    }


    const dialogRef = this.dialog.open(CommandesFournisseursComponent, {
      width: '1400px',
      maxWidth: '98vw',
      height: '92vh',
      panelClass: 'full-dialog',
      disableClose: true,
      autoFocus: false,
      data: {
        commandeId: this.selectedCommande?.id,
        mode: 'edit',
        commande: this.selectedCommande
      }
    });

    dialogRef.afterClosed()
      .pipe(take(1))
      .subscribe((updated: boolean | any) => {
        if (updated) {
          this.refresh();
        }
      });
  }

  openLignes(): void {
    if (!this.selectedCommande) return;
    console.log('Accès lignes', this.selectedCommande.id);
  }

  cloturer(): void {
    if (!this.selectedCommande) return;
    console.log('Clôturer', this.selectedCommande.id);
  }

  transferer(): void {
    if (!this.selectedCommande) return;
    console.log('Transférer', this.selectedCommande.id);
  }



  exportExcel(): void {
    console.log('Exporter Excel');
  }

  openAdvancedFilters(): void {
    console.log('Ouvrir filtres avancés');
  }

  openDetail(row: CommandeAchatListItem): void {
    console.log('Détail commande', row.id);
    // this.router.navigate(['/admin/achats/commandes/detail', row.id]);
  }

  private getDefaultDateRange(): { dateDebut: Date; dateFin: Date } {
    const today = new Date();

    // Début du mois courant
    const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Début du mois il y a 3 mois
    const dateDebut = new Date(
      startOfCurrentMonth.getFullYear(),
      startOfCurrentMonth.getMonth() - 3,
      1
    );

    // Fin du mois courant
    const dateFin = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    );

    return { dateDebut, dateFin };
  }


  exportPdf(): void {
    if (!this.selectedCommande) {
      return;
    }

    const commande = this.selectedCommande;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const marginLeft = 12;
    const marginRight = 12;
    let y = 12;

    const formatMoney = (value: any): string => {
      const n = Number(value ?? 0);
      const fixed = n.toFixed(2); // ex: 80000.00
      const parts = fixed.split('.');
      const entier = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return `${entier}.${parts[1]}`;
    };

    const formatQty = (value: any): string => {
      const n = Number(value ?? 0);
      const fixed = Number.isInteger(n) ? n.toString() : n.toFixed(3);
      const parts = fixed.split('.');
      const entier = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      return parts[1] ? `${entier}.${parts[1]}` : entier;
    };

    const safe = (value: any, fallback = '-'): string => {
      if (value === null || value === undefined || value === '') return fallback;
      return String(value);
    };

    const dateCommande = commande.dateCommande
      ? new Date(commande.dateCommande).toLocaleDateString('fr-FR')
      : '-';

    const datePrevue = commande.dateLivraisonPrevue || commande.dateLivraisonPrevue
      ? new Date(commande.dateLivraisonPrevue || commande.dateLivraisonPrevue).toLocaleDateString('fr-FR')
      : '-';

    // ===== HEADER ENTREPRISE =====
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.6);
    doc.roundedRect(marginLeft, y, pageWidth - 24, 28, 2, 2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('BON DE COMMANDE', marginLeft + 4, y + 8);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('SERVICE ACHATS', marginLeft + 4, y + 14);
    doc.text('Document de commande fournisseur', marginLeft + 4, y + 19);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Réf. : ${safe(commande.refCommande, 'N/A')}`, pageWidth - 70, y + 8);
    doc.text(`Date : ${dateCommande}`, pageWidth - 70, y + 14);
    doc.text(`Statut : ${safe(commande.statut)}`, pageWidth - 70, y + 20);

    y += 34;

    // ===== BLOC FOURNISSEUR / INFOS =====
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('INFORMATIONS FOURNISSEUR', marginLeft, y);

    y += 2;
    doc.setLineWidth(0.2);
    doc.line(marginLeft, y + 1, pageWidth - marginRight, y + 1);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    doc.text(`Fournisseur : ${safe(commande.fournisseurNom)}`, marginLeft, y);
    doc.text(`Utilisateur : ${safe(commande.user, 'Anonyme')}`, pageWidth / 2 + 8, y);
    y += 6;

    doc.text(`Devise : ${safe(commande.devise)}`, marginLeft, y);
    doc.text(`Taux : ${formatMoney(commande.taux)}`, pageWidth / 2 + 8, y);
    y += 6;

    doc.text(`Livraison prévue : ${datePrevue}`, marginLeft, y);
    doc.text(`Position livraison : ${safe(commande.dateLivraisonPrevue)}`, pageWidth / 2 + 8, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.text('Observation :', marginLeft, y);
    doc.setFont('helvetica', 'normal');

    const observationLines = doc.splitTextToSize(
      safe(commande.observation, 'Aucune observation'),
      pageWidth - marginLeft - marginRight - 22
    );
    doc.text(observationLines, marginLeft + 22, y);

    y += Math.max(10, observationLines.length * 5 + 2);

    // ===== TABLEAU LIGNES =====
    const body = (commande.lignes || []).map((ligne: any, index: number) => [
      index + 1,
      safe(ligne.produitNom),
      safe(ligne.codeBarres),
      formatQty(ligne.quantiteCommandee),
      formatMoney(ligne.prixUnitaire),
      formatMoney(0),
      formatMoney(ligne.montantLigne)
    ]);

    autoTable(doc, {
      startY: y,
      head: [[
        'N°',
        'Produit',
        'Code-barres',
        'Qté',
        'Prix unitaire',
        'Remise',
        'Montant'
      ]],
      body,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 2,
        lineColor: [180, 180, 180],
        lineWidth: 0.1,
        textColor: [20, 20, 20],
        valign: 'middle'
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { cellWidth: 56 },
        2: { cellWidth: 32 },
        3: { halign: 'right', cellWidth: 16 },
        4: { halign: 'right', cellWidth: 24 },
        5: { halign: 'right', cellWidth: 20 },
        6: { halign: 'right', cellWidth: 24 }
      },
      margin: { left: marginLeft, right: marginRight }
    });

    y = (doc as any).lastAutoTable.finalY + 8;

    // ===== TOTAUX =====
    const boxWidth = 78;
    const boxX = pageWidth - marginRight - boxWidth;

    doc.setDrawColor(120, 120, 120);
    doc.setLineWidth(0.2);
    doc.roundedRect(boxX, y, boxWidth, 24, 2, 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Montant brut :', boxX + 4, y + 7);
    doc.text(formatMoney(commande.montantBrut), boxX + boxWidth - 4, y + 7, { align: 'right' });

    doc.text('Remise :', boxX + 4, y + 13);
    doc.text(formatMoney(commande.montantRemise), boxX + boxWidth - 4, y + 13, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Montant total :', boxX + 4, y + 20);
    doc.text(
      `${formatMoney(commande.montantTotal)} ${safe(commande.devise, '')}`,
      boxX + boxWidth - 4,
      y + 20,
      { align: 'right' }
    );

    y += 34;

    // ===== SIGNATURES =====
    if (y < pageHeight - 40) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Validation', marginLeft, y);

      y += 10;

      doc.setFont('helvetica', 'normal');
      doc.text('Établi par', marginLeft, y);
      doc.text('Validé par', pageWidth / 2 - 10, y);
      doc.text('Fournisseur', pageWidth - 45, y);

      y += 18;

      doc.line(marginLeft, y, marginLeft + 45, y);
      doc.line(pageWidth / 2 - 10, y, pageWidth / 2 + 35, y);
      doc.line(pageWidth - 55, y, pageWidth - 10, y);
    }

    // ===== FOOTER =====
    const footerText = `Bon de commande ${safe(commande.refCommande)} - Généré le ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')}`;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(footerText, pageWidth / 2, pageHeight - 8, { align: 'center' });

    // ===== IMPRESSION =====
    const blobUrl = doc.output('bloburl');
    const win = window.open(blobUrl, '_blank');

    if (win) {
      win.onload = () => {
        win.print();
      };
    }
  }

  receptionner(): void {
    if (!this.selectedCommande) {
      this.snackBar.open('Aucune commande sélectionnée.', 'Fermer', { duration: 3000 });
      return;
    }

    if (this.selectedCommande.statut !== 'VALIDEE' && this.selectedCommande.statut !== 'RECEPTION_PARTIELLE') {
      this.snackBar.open('La commande doit être validée avant la réception \n soit elle déjà receptionnée.', 'Fermer', { duration: 3500 });
      return;
    }

    this.router.navigate(['/admin/achats/receptions'], {
      queryParams: {
        commandeId: this.selectedCommande.id
      }
    });
  }



}

