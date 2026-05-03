import { ChangeDetectorRef, Component, OnInit, AfterViewInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommandeAchatStore } from '../../service/achat/CommandeAchatStore';
import { FormGroup, FormBuilder, FormArray } from '@angular/forms';
import { CommandeAchatListItem } from '../../models/commande-achat.model';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CommandesFournisseursComponent } from '../commandes-fournisseurs-component/commandes-fournisseurs-component';
import { take } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { VoirDdetilsLignesComponents } from '../voir-ddetils-lignes-components/voir-ddetils-lignes-components';
import {
  BrowserMultiFormatReader,
  IScannerControls
} from '@zxing/browser';
import { ElementRef, ViewChild } from '@angular/core';
import { CaisseStoreService } from '../../../caisse/services/CaisseServiceStore';

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
  dernierTaux = 0;
  loadingTaux = false;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private commandeAchatStore: CommandeAchatStore,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private snackBar: MatSnackBar,
    private caisseStore: CaisseStoreService
  ) { }

  ngOnInit(): void {
    this.chargerDernierTauxActif();
    this.loading = true;
    this.initForm();
    this.loadData();
    this.search();
  }


  // ngAfterViewInit(): void {
  //   this.loading = true;
  //   this.cdr.detectChanges();
  // }



  private chargerDernierTauxActif(): void {
  this.loadingTaux = true;

  this.caisseStore.loadTauxActif().subscribe({
    next: (taux) => {
      this.dernierTaux = Number(taux?.taux ?? 0);
      this.loadingTaux = false;
    },
    error: (err) => {
      console.error(err);
      this.dernierTaux = 0;
      this.loadingTaux = false;
    }
  });
}

convertirFcEnUsd(montantFc: number): number {
  if (!montantFc || !this.dernierTaux || this.dernierTaux <= 0) {
    return 0;
  }

  return +(Number(montantFc) / this.dernierTaux).toFixed(2);
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
  const formValue = this.filterForm.getRawValue();

  const request = {
    ...formValue,
    dateDebut: this.formatDate(formValue.dateDebut),
    dateFin: this.formatDate(formValue.dateFin)
  };

  this.loading = true;
  this.selectedCommande = null;

  this.commandeAchatStore.loadIfNeeded().subscribe({
    next: () => {
      this.commandeAchatStore.searchLocal(request).subscribe({
        next: (data) => {
          this.commandes = data ?? [];
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.loading = false;
          this.snackBar.open('Erreur lors de la recherche.', 'Fermer', {
            duration: 3000
          });
        }
      });
    },
    error: (err) => {
      console.error(err);
      this.loading = false;
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
    dateDebut,
    dateFin,
    fournisseur: '',
    enCours: true,
    terminee: true,
    nonLivre: false,
    partielLivre: true,
    livre: false,
    mesCommandes: false,
    vingtDerniers: false
  });

  this.search();
}

 refresh(): void {
  this.loading = true;
  this.selectedCommande = null;

  this.commandeAchatStore.refresh().subscribe({
    next: (data) => {
      this.commandes = data ?? [];
      this.loading = false;
      this.snackBar.open('Liste actualisée avec succès.', 'Fermer', {
        duration: 2500
      });
    },
    error: (err) => {
      console.error(err);
      this.loading = false;
      this.snackBar.open('Erreur lors de l’actualisation.', 'Fermer', {
        duration: 3000
      });
    }
  });
}



  createCommande(): void {
    const dialogRef = this.dialog.open(CommandesFournisseursComponent, {
    width: '100vw',
    height: '100vh',
    maxWidth: '100vw',
    maxHeight: '100vh',
    panelClass: 'full-dialog',
    autoFocus: false,
      disableClose: true,
      data: {
        mode: 'create'
      },
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
    width: '100vw',
    height: '100vh',
    maxWidth: '100vw',
    maxHeight: '100vh',
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






openAdvancedFilters(): void {
  this.snackBar.open('Filtres avancés déjà disponibles dans le panneau.', 'Fermer', {
    duration: 2500
  });
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
  if (!this.selectedCommande) return;

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

  const normalizeDevise = (devise: any): string => {
    const d = String(devise ?? '').trim().toUpperCase();

    if (['USD', '$', 'DOLLAR', 'DOLLARS'].includes(d)) return 'USD';
    if (['CDF', 'FC', 'FCB', 'FRANC', 'FRANCS'].includes(d)) return 'CDF';

    return d || 'USD';
  };

  const deviseLabel = (devise: any): string => {
    const d = normalizeDevise(devise);
    return d === 'CDF' ? 'FC' : '$';
  };

  const formatMoney = (value: any, devise?: any): string => {
    const n = Number(value ?? 0);
    const fixed = n.toFixed(2);
    const parts = fixed.split('.');
    const entier = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    const montant = `${entier}.${parts[1]}`;

    return devise ? `${montant} ${deviseLabel(devise)}` : montant;
  };

  const toUsd = (montant: any, devise: any, taux: any): number => {
    const amount = Number(montant ?? 0);
    const rate = Number(taux ?? 0);

    if (normalizeDevise(devise) === 'USD') return amount;
    if (!rate) return 0;

    return amount / rate;
  };

  const toCdf = (montant: any, devise: any, taux: any): number => {
    const amount = Number(montant ?? 0);
    const rate = Number(taux ?? 0);

    if (normalizeDevise(devise) === 'CDF') return amount;

    return amount * rate;
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

  const devise = normalizeDevise(commande.devise);
  const taux = Number(commande.taux ?? 0);

  const montantBrut = Number(commande.montantBrut ?? 0);
  const montantRemise = Number(commande.montantRemise ?? 0);
  const montantTotal = Number(commande.montantTotal ?? 0);

  const totalUSD = toUsd(montantTotal, devise, taux);
  const totalCDF = toCdf(montantTotal, devise, taux);

  const dateCommande = commande.dateCommande
    ? new Date(commande.dateCommande).toLocaleDateString('fr-FR')
    : '-';

  const datePrevue = commande.dateLivraisonPrevue
    ? new Date(commande.dateLivraisonPrevue).toLocaleDateString('fr-FR')
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

  doc.text(`Devise : ${devise === 'CDF' ? 'FC' : 'USD'}`, marginLeft, y);
  doc.text(`Taux : ${formatMoney(taux, 'CDF')}`, pageWidth / 2 + 8, y);
  y += 6;

  doc.text(`Livraison prévue : ${datePrevue}`, marginLeft, y);
  doc.text(`Position livraison : ${safe((commande as any).positionLivraison ?? commande.statut)}`, pageWidth / 2 + 8, y);
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
    formatMoney(ligne.prixUnitaire, devise),
    formatMoney(ligne.remise ?? 0, devise),
    formatMoney(ligne.montantLigne, devise)
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
  const boxWidth = 88;
  const boxX = pageWidth - marginRight - boxWidth;

  if (y > pageHeight - 70) {
    doc.addPage();
    y = 15;
  }

  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.2);
  doc.roundedRect(boxX, y, boxWidth, 38, 2, 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  doc.text('Montant brut :', boxX + 4, y + 7);
  doc.text(formatMoney(montantBrut, devise), boxX + boxWidth - 4, y + 7, { align: 'right' });

  doc.text('Remise :', boxX + 4, y + 13);
  doc.text(formatMoney(montantRemise, devise), boxX + boxWidth - 4, y + 13, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Montant total :', boxX + 4, y + 20);
  doc.text(formatMoney(montantTotal, devise), boxX + boxWidth - 4, y + 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  doc.text('Équivalent USD :', boxX + 4, y + 28);
  doc.text(formatMoney(totalUSD, 'USD'), boxX + boxWidth - 4, y + 28, { align: 'right' });

  doc.text('Équivalent FC :', boxX + 4, y + 34);
  doc.text(formatMoney(totalCDF, 'CDF'), boxX + boxWidth - 4, y + 34, { align: 'right' });

  y += 48;

  // ===== SIGNATURES =====
  if (y > pageHeight - 45) {
    doc.addPage();
    y = 20;
  }

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

  // ===== FOOTER SUR TOUTES LES PAGES =====
  const pageCount = doc.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    const footerText =
      `Bon de commande ${safe(commande.refCommande)} - Page ${i}/${pageCount} - Généré le ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')}`;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text(footerText, pageWidth / 2, pageHeight - 8, { align: 'center' });
  }

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

exportExcel(): void {
  if (!this.commandes.length) {
    this.snackBar.open('Aucune commande à exporter.', 'Fermer', {
      duration: 3000
    });
    return;
  }

  const now = new Date();
  const fileName = `commandes_fournisseurs_${now.getTime()}.xlsx`;

  const totalNet = this.commandes.reduce((s, r) => s + Number(r.montantNet ?? r.montantTotal ?? 0), 0);
  const totalBrut = this.commandes.reduce((s, r) => s + Number(r.montantBrut ?? r.montantTotal ?? 0), 0);
  const totalTtc = this.commandes.reduce((s, r) => s + Number(r.montantTtc ?? r.montantTotal ?? 0), 0);

  const rows = this.commandes.map(row => ({
    Référence: row.refCommande || `CF-${row.id}`,
    Date: row.dateCommande ? new Date(row.dateCommande) : '',
    Fournisseur: row.fournisseurNom || '',
    Statut: row.statut || '',
    'Montant net': Number(row.montantNet ?? row.montantTotal ?? 0),
    'Montant brut': Number(row.montantBrut ?? row.montantTotal ?? 0),
    'Montant TTC': Number(row.montantTtc ?? row.montantTotal ?? 0),
    Devise: 'FC',
    Opérateur: row.operateur || ''
  }));

  const header = [
    'Référence',
    'Date',
    'Fournisseur',
    'Statut',
    'Montant net',
    'Montant brut',
    'Montant TTC',
    'Devise',
    'Opérateur'
  ];

  const data: any[][] = [
    ['TABLEAU DE BORD DES COMMANDES FOURNISSEURS'],
    [`Exporté le ${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR')}`],
    [],
    ['Résumé', '', '', '', 'Total Net', 'Total Brut', 'Total TTC', 'Devise', 'Nombre'],
    ['', '', '', '', totalNet, totalBrut, totalTtc, 'FC', this.commandes.length],
    [],
    header,
    ...rows.map(r => header.map(h => (r as any)[h]))
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
    { s: { r: 3, c: 0 }, e: { r: 4, c: 3 } }
  ];

  ws['!cols'] = [
    { wch: 22 },
    { wch: 18 },
    { wch: 32 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 10 },
    { wch: 22 }
  ];

  ws['!freeze'] = { xSplit: 0, ySplit: 7 };

  const range = XLSX.utils.decode_range(ws['!ref'] as string);

  const titleStyle = {
    font: { bold: true, sz: 18, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '0F172A' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: '0F172A' } },
      bottom: { style: 'thin', color: { rgb: '0F172A' } },
      left: { style: 'thin', color: { rgb: '0F172A' } },
      right: { style: 'thin', color: { rgb: '0F172A' } }
    }
  };

  const subTitleStyle = {
    font: { italic: true, sz: 11, color: { rgb: '475569' } },
    alignment: { horizontal: 'center', vertical: 'center' }
  };

  const summaryHeaderStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '2563EB' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'CBD5E1' } },
      bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
      left: { style: 'thin', color: { rgb: 'CBD5E1' } },
      right: { style: 'thin', color: { rgb: 'CBD5E1' } }
    }
  };

  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '1E293B' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: '94A3B8' } },
      bottom: { style: 'thin', color: { rgb: '94A3B8' } },
      left: { style: 'thin', color: { rgb: '94A3B8' } },
      right: { style: 'thin', color: { rgb: '94A3B8' } }
    }
  };

  const bodyStyle = {
    font: { color: { rgb: '0F172A' } },
    alignment: { vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'E2E8F0' } },
      bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
      left: { style: 'thin', color: { rgb: 'E2E8F0' } },
      right: { style: 'thin', color: { rgb: 'E2E8F0' } }
    }
  };

  ws['A1'].s = titleStyle;
  ws['A2'].s = subTitleStyle;

  for (let c = 0; c <= 8; c++) {
    const cell1 = XLSX.utils.encode_cell({ r: 0, c });
    const cell2 = XLSX.utils.encode_cell({ r: 1, c });

    if (!ws[cell1]) ws[cell1] = { t: 's', v: '' };
    if (!ws[cell2]) ws[cell2] = { t: 's', v: '' };

    ws[cell1].s = titleStyle;
    ws[cell2].s = subTitleStyle;
  }

  for (let c = 0; c <= 8; c++) {
    const cell = XLSX.utils.encode_cell({ r: 3, c });
    if (ws[cell]) ws[cell].s = summaryHeaderStyle;
  }

  for (let c = 4; c <= 8; c++) {
    const cell = XLSX.utils.encode_cell({ r: 4, c });
    if (ws[cell]) {
      ws[cell].s = {
        ...bodyStyle,
        font: { bold: true, color: { rgb: '0F172A' } },
        fill: { fgColor: { rgb: 'EFF6FF' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };

      if (c >= 4 && c <= 6) {
        ws[cell].z = '#,##0.00';
      }
    }
  }

  for (let c = 0; c <= 8; c++) {
    const cell = XLSX.utils.encode_cell({ r: 6, c });
    if (ws[cell]) ws[cell].s = headerStyle;
  }

  for (let r = 7; r <= range.e.r; r++) {
    for (let c = 0; c <= range.e.c; c++) {
      const cell = XLSX.utils.encode_cell({ r, c });
      if (!ws[cell]) continue;

      const isEven = r % 2 === 0;

      ws[cell].s = {
        ...bodyStyle,
        fill: { fgColor: { rgb: isEven ? 'F8FAFC' : 'FFFFFF' } },
        alignment: {
          horizontal: c >= 4 && c <= 7 ? 'right' : 'left',
          vertical: 'center'
        }
      };

      if (c === 1 && ws[cell].v) {
        ws[cell].z = 'dd/mm/yyyy';
      }

      if (c >= 4 && c <= 6) {
        ws[cell].z = '#,##0.00';
      }

      if (c === 3) {
        ws[cell].s = {
          ...ws[cell].s,
          font: { bold: true, color: { rgb: '1D4ED8' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        };
      }
    }
  }

  ws['!autofilter'] = {
    ref: `A7:I${range.e.r + 1}`
  };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Commandes');

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

}

