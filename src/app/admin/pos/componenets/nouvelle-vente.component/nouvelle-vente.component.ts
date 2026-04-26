import { Component, computed, ElementRef, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { Toast } from '../../../../shares/services/toast/toast';
import { TarifVenteStore } from '../../service/tarif/TarifVenteStore';
import { forkJoin, finalize } from 'rxjs';
import { ProduitStoreService } from '../../../produits/core/produit-store.service';
import { MatDialog } from '@angular/material/dialog';
import { ProduitPickerDialogComponent } from '../produit-picker-dialog-component/produit-picker-dialog-component';
import { ServiceStockStore } from '../../../stock/service/stock-service/service-stock.store';
import { VenteStore } from '../../service/VenteStore';
import { Route, Router } from '@angular/router';
import { DepotStoreService } from '../../../stock/service/stock-service/DepotStoreService';
interface ProduitTarifie {
  id: number;
  codeBarres: string;
  reference?: string;
  nom: string;
  description?: string;
  categorieId: number;
  categorieNom?: string;

  tarifId: number | null;
  tarifNom: string | null;
  tarifCode?: string | null;

  regleTarifId: number | null;
  tauxMarge: number;
  tauxRemiseMax: number;
  tauxRemiseApplique: number;
  montantRemise: number;
  modeArrondi: string | null;

  baseTarification: number;
  prixBrut: number;
  prixNetAvantArrondi: number;
  prixFinal: number;
  prixUnitaire: number;

  prixVenteOriginal?: number;
  prixAchat?: number | null;
  pmp?: number | null;

  stock?: number;
  stockMinimum?: number;
  stockMaximum?: number;
  actif?: boolean;

  imagePrincipale?: string | null;
  images?: any[];

  produitSource: any;
  regleSource: any | null;
}

interface LignePanier {
  id: number;
  produitId: number;
  codeBarres: string;
  reference?: string;
  produit: string;
  tarifId: number | null;
  tarifNom: string | null;
  prix: number;
  quantite: number;
  remise: number;
  stock: number;
  imagePrincipale?: string | null;
  produitTarifie: ProduitTarifie;
}


@Component({
  selector: 'app-nouvelle-vente.component',
  templateUrl: './nouvelle-vente.component.html',
  styleUrl: './nouvelle-vente.component.css',
  standalone: false
})
export class NouvelleVenteComponent implements OnInit, OnDestroy {
 loading = signal<boolean>(false);

  produits = signal<any[]>([]);
  tarifs = signal<any[]>([]);
  reglesTarif = signal<any[]>([]);
  stocks = signal<any[]>([]);
  ventes = signal<any[]>([]);
  depots = signal<any[]>([]);
  produitsTarifies = signal<ProduitTarifie[]>([]);

  lignes = signal<LignePanier[]>([]);
  selectedRowId = signal<number | null>(null);
  selectedTarifId = signal<number | null>(null);
  selectedDepotId = signal<number | null>(null);

  recherche = '';
  produitSelectionId: number | null = null;

  clientNom = '';
  ticketNumero = '';
  modePaiement = 'CASH';
  montantRecu: number | null = null;

  displayedColumns: string[] = [
    'selection',
    'code',
    'produit',
    'prix',
    'quantite',
    'remise',
    'total',
    'action'
  ];

  @ViewChild('scannerVideo', { static: false })
  scannerVideoRef?: ElementRef<HTMLVideoElement>;

  scanAutoActif = false;
  scanMessage = 'Place le code-barres devant la caméra';
  showAllQuickProducts = false;

  private mediaStream: MediaStream | null = null;
  private scanInterval: any = null;
  private lastScannedCode: string | null = null;
  private lastScannedAt = 0;

  readonly tarifsActifs = computed(() =>
    this.tarifs().filter(t => !!t?.actif)
  );

  readonly depotsActifs = computed(() =>
    this.depots().filter((d: any) => d?.actif !== false)
  );

  constructor(
    private produitStore: ProduitStoreService,
    private tarifVenteStore: TarifVenteStore,
    private stockStore: ServiceStockStore,
    private depotStore: DepotStoreService,
    private toastr: Toast,
    private venteStore: VenteStore,
    private dialog: MatDialog,
    private route: Router
  ) {}

  ngOnInit(): void {
    this.initialiserTicket();
    this.initialiserVente();

    setTimeout(() => {
      this.demarrerScanAutoSilencieux();
    }, 700);
  }

  ngOnDestroy(): void {
    this.stopScanAuto();
  }

  private genererTicketNumero(): string {
    const now = new Date();

    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    const random = Math.floor(100 + Math.random() * 900);

    return `TCK-${yyyy}${mm}${dd}-${hh}${mi}${ss}-${random}`;
  }

  private initialiserTicket(): void {
    this.ticketNumero = this.genererTicketNumero();
  }

  nouveauTicket(): void {
    this.viderPanier();
    this.clientNom = '';
    this.modePaiement = 'CASH';
    this.montantRecu = null;
    this.initialiserTicket();
  }

  private initialiserVente(): void {
    this.loading.set(true);

    forkJoin({
      produits: this.produitStore.loadIfNeeded(),
      tarifs: this.tarifVenteStore.ensureTarifsLoaded(),
      regles: this.tarifVenteStore.ensureReglesLoaded(),
      stocks: this.stockStore.loadIfNeeded(),
      depots: this.depotStore.loadIfNeeded()
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ produits, tarifs, regles, stocks, depots }) => {
          const produitsList = Array.isArray(produits) ? produits : [];
          const tarifsList = Array.isArray(tarifs) ? tarifs : [];
          const reglesList = Array.isArray(regles) ? regles : [];
          const stocksList = Array.isArray(stocks) ? stocks : [];
          const depotsList = Array.isArray(depots) ? depots : [];

          this.produits.set(produitsList);
          this.tarifs.set(tarifsList);
          this.reglesTarif.set(reglesList);
          this.stocks.set(stocksList);
          this.depots.set(depotsList);

          const tarifDefaut =
            tarifsList.find((t: any) => t?.parDefaut === true && t?.actif === true) ||
            tarifsList.find((t: any) => t?.parDefaut === true) ||
            tarifsList.find((t: any) => t?.actif === true) ||
            tarifsList[0] ||
            null;

          this.selectedTarifId.set(tarifDefaut?.id ?? null);

          const depotDefaut =
            depotsList.find((d: any) => d?.parDefaut === true && d?.actif !== false) ||
            depotsList.find((d: any) => d?.parDefaut === true) ||
            depotsList.find((d: any) => d?.actif !== false) ||
            depotsList[0] ||
            null;

          this.selectedDepotId.set(depotDefaut?.id ?? null);

          this.genererProduitsTarifies();

          console.log('Produits:', this.produits());
          console.log('Stocks:', this.stocks());
          console.log('Produits tarifés:', this.produitsTarifies());

          this.toastr.success('Données de vente chargées');
        },
        error: (err) => {
          console.error('Erreur chargement vente :', err);
          this.toastr.error('Impossible de charger les données de vente');
        }
      });
  }

  onDepotChange(depotId: number | null): void {
    this.selectedDepotId.set(depotId ? Number(depotId) : null);
  }

  getSelectedDepot(): any | null {
    const id = this.selectedDepotId();
    if (!id) return null;
    return this.depots().find((d: any) => Number(d?.id) === Number(id)) ?? null;
  }

  getSelectedDepotNom(): string {
    return this.getSelectedDepot()?.nom ?? '-';
  }

  private genererProduitsTarifies(): void {
    const produitsAvecStock = this.fusionnerProduitsAvecStock(
      this.produits(),
      this.stocks()
    );

    const tarif = this.getSelectedTarif();

    const liste = this.tarifierProduits(
      produitsAvecStock,
      this.reglesTarif(),
      tarif
    );

    this.produitsTarifies.set(liste);
  }

  onTarifChange(tarifId: number): void {
    this.selectedTarifId.set(tarifId);
    this.genererProduitsTarifies();
  }

  getSelectedTarif(): any | null {
    const id = this.selectedTarifId();
    if (!id) return null;
    return this.tarifs().find((t: any) => Number(t?.id) === Number(id)) ?? null;
  }

  getSelectedTarifNom(): string {
    return this.getSelectedTarif()?.nom ?? '-';
  }

  openProduitDialog(): void {
    const dialogRef = this.dialog.open(ProduitPickerDialogComponent, {
      width: '1100px',
      maxWidth: '95vw',
      data: {
        produits: this.produitsTarifies(),
        tarifId: this.selectedTarifId(),
        tarifNom: this.getSelectedTarifNom(),
        depotId: this.selectedDepotId(),
        depotNom: this.getSelectedDepotNom()
      }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (!result || !Array.isArray(result)) return;

      result.forEach(item => {
        const produitTarifie = item?.produit;
        const quantite = this.toNumber(item?.quantite || 1);
        this.ajouterProduitTarifieAuPanier(produitTarifie, quantite);
      });
    });
  }

  ajouterProduitTactile(produit: ProduitTarifie): void {
    this.ajouterProduitTarifieAuPanier(produit, 1);
  }

  ajouterDepuisSelection(): void {
    if (!this.produitSelectionId) {
      this.toastr.error('Sélectionne un produit');
      return;
    }

    const produit = this.produitsTarifies().find(
      p => Number(p.id) === Number(this.produitSelectionId)
    );

    if (!produit) {
      this.toastr.error('Produit introuvable');
      return;
    }

    this.ajouterProduitTarifieAuPanier(produit, 1);
    this.produitSelectionId = null;
  }

  ajouterPremierResultatRecherche(): void {
    const premier = this.produitsFiltres()[0];
    if (!premier) {
      this.toastr.error('Aucun produit trouvé');
      return;
    }
    this.ajouterDepuisRecherche(premier);
  }

  ajouterDepuisRecherche(produit: ProduitTarifie): void {
    this.ajouterProduitTarifieAuPanier(produit, 1);
  }

  onRechercheChange(value: string): void {
    this.recherche = value || '';

    const term = this.recherche.trim();
    if (!term) return;

    const matches = this.produitsFiltres();

    if (matches.length === 1) {
      const p = matches[0];
      const normalized = term.toLowerCase();

      const exact =
        (p.nom || '').toLowerCase() === normalized ||
        (p.codeBarres || '').toLowerCase() === normalized ||
        (p.reference || '').toLowerCase() === normalized;

      if (exact) {
        this.ajouterDepuisRecherche(p);
        this.recherche = '';
      }
    }
  }

  produitsFiltres(): ProduitTarifie[] {
    const term = (this.recherche || '').trim().toLowerCase();
    if (!term) return [];

    return this.produitsTarifies().filter(p =>
      (p.nom || '').toLowerCase().includes(term) ||
      (p.codeBarres || '').toLowerCase().includes(term) ||
      (p.reference || '').toLowerCase().includes(term) ||
      (p.categorieNom || '').toLowerCase().includes(term)
    );
  }

  private ajouterProduitTarifieAuPanier(produit: ProduitTarifie, quantite: number = 1): void {
    if (!produit) return;

    const qte = Math.max(1, this.toNumber(quantite));

    if (this.toNumber(produit.stock) <= 0) {
      this.toastr.error(`Le produit "${produit.nom}" n'est plus disponible en stock`);
      return;
    }

    const current = [...this.lignes()];
    const existingIndex = current.findIndex(l => Number(l.produitId) === Number(produit.id));

    if (existingIndex !== -1) {
      const existing = current[existingIndex];
      const nouvelleQuantite = existing.quantite + qte;

      if (nouvelleQuantite > this.toNumber(produit.stock)) {
        this.toastr.error(`Stock insuffisant pour "${produit.nom}"`);
        return;
      }

      current[existingIndex] = {
        ...existing,
        quantite: nouvelleQuantite,
        remise: this.arrondir2(existing.produitTarifie.montantRemise * nouvelleQuantite)
      };

      this.lignes.set(current);
      return;
    }

    if (qte > this.toNumber(produit.stock)) {
      this.toastr.error(`Stock insuffisant pour "${produit.nom}"`);
      return;
    }

    const ligne: LignePanier = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      produitId: produit.id,
      codeBarres: produit.codeBarres,
      reference: produit.reference ?? '',
      produit: produit.nom,
      tarifId: produit.tarifId,
      tarifNom: produit.tarifNom,
      prix: produit.prixFinal,
      quantite: qte,
      remise: this.arrondir2(produit.montantRemise * qte),
      stock: this.toNumber(produit.stock),
      imagePrincipale: produit.imagePrincipale,
      produitTarifie: produit
    };

    this.lignes.set([ligne, ...current]);
  }

  viderPanier(): void {
    this.lignes.set([]);
    this.selectedRowId.set(null);
  }

  supprimerLigne(id: number): void {
    this.lignes.set(this.lignes().filter(l => Number(l.id) !== Number(id)));
    if (Number(this.selectedRowId()) === Number(id)) {
      this.selectedRowId.set(null);
    }
  }

  selectRow(id: number): void {
    this.selectedRowId.set(id);
  }

  isSelected(id: number): boolean {
    return Number(this.selectedRowId()) === Number(id);
  }

  incrementer(id: number): void {
    this.lignes.update(list =>
      list.map(l => {
        if (Number(l.id) !== Number(id)) return l;

        const quantite = l.quantite + 1;
        if (quantite > this.toNumber(l.stock)) {
          this.toastr.error(`Stock insuffisant pour "${l.produit}"`);
          return l;
        }

        return {
          ...l,
          quantite,
          remise: this.arrondir2(l.produitTarifie.montantRemise * quantite)
        };
      })
    );
  }

  decrementer(id: number): void {
    this.lignes.update(list =>
      list.map(l => {
        if (Number(l.id) !== Number(id)) return l;

        const quantite = Math.max(1, l.quantite - 1);
        return {
          ...l,
          quantite,
          remise: this.arrondir2(l.produitTarifie.montantRemise * quantite)
        };
      })
    );
  }

  ligneTotal(row: LignePanier): number {
    return this.arrondir2(
      (this.toNumber(row.prix) * this.toNumber(row.quantite)) - this.toNumber(row.remise)
    );
  }

  totalArticles(): number {
    return this.lignes().reduce((sum, l) => sum + this.toNumber(l.quantite), 0);
  }

  nombreLignes(): number {
    return this.lignes().length;
  }

  sousTotal(): number {
    return this.arrondir2(
      this.lignes().reduce((sum, l) => sum + (this.toNumber(l.prix) * this.toNumber(l.quantite)), 0)
    );
  }

  totalRemise(): number {
    return this.arrondir2(
      this.lignes().reduce((sum, l) => sum + this.toNumber(l.remise), 0)
    );
  }

  totalGeneral(): number {
    return this.arrondir2(this.sousTotal() - this.totalRemise());
  }

  monnaie(): number {
    return this.arrondir2(this.toNumber(this.montantRecu) - this.totalGeneral());
  }

  alertesStock(): string[] {
    return this.lignes()
      .filter(l => this.toNumber(l.stock) > 0 && this.toNumber(l.quantite) > this.toNumber(l.stock))
      .map(l => `${l.produit} : quantité demandée supérieure au stock disponible (${l.stock})`);
  }

  imprimerTicketPDF(): void {
    if (!this.lignes().length) {
      this.toastr.error('Aucune ligne à imprimer');
      return;
    }

    import('jspdf').then(jsPDFModule => {
      const jsPDF = jsPDFModule.default;

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 220]
      });

      let y = 6;
      const pageWidth = 80;
      const left = 4;
      const right = 76;
      const center = pageWidth / 2;

      const ensureSpace = (needed = 6) => {
        if (y + needed > 210) {
          doc.addPage([80, 220], 'portrait');
          y = 6;
        }
      };

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('PEACE POS', center, y, { align: 'center' });

      y += 4;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Ticket : ${this.ticketNumero}`, center, y, { align: 'center' });

      y += 4;
      doc.text(`${new Date().toLocaleString()}`, center, y, { align: 'center' });

      y += 4;
      doc.text(`Client : ${this.clientNom || 'Comptoir'}`, center, y, { align: 'center' });

      y += 4;
      doc.text(`Paiement : ${this.modePaiement || 'CASH'}`, center, y, { align: 'center' });

      y += 3;
      doc.line(left, y, right, y);

      y += 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);

      doc.text('Article', left, y);
      doc.text('Qté', 40, y, { align: 'right' });
      doc.text('PU', 56, y, { align: 'right' });
      doc.text('Total', right, y, { align: 'right' });

      y += 2;
      doc.line(left, y, right, y);

      y += 4;

      this.lignes().forEach(l => {
        ensureSpace(10);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(this.truncate(l.produit, 22), left, y);

        y += 3.5;

        doc.setFont('helvetica', 'normal');
        doc.text(`${l.quantite}`, 40, y, { align: 'right' });
        doc.text(this.formatMoney(l.prix), 56, y, { align: 'right' });
        doc.text(this.formatMoney(this.ligneTotal(l)), right, y, { align: 'right' });

        y += 4;

        if (this.toNumber(l.remise) > 0) {
          ensureSpace(4);
          doc.setFontSize(7);
          doc.text(`Remise ligne : ${this.formatMoney(l.remise)}`, right, y, { align: 'right' });
          y += 3.5;
        }
      });

      ensureSpace(24);

      y += 1;
      doc.line(left, y, right, y);

      y += 5;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Sous-total', left, y);
      doc.text(this.formatMoney(this.sousTotal()), right, y, { align: 'right' });

      y += 4;
      doc.text('Remise', left, y);
      doc.text(this.formatMoney(this.totalRemise()), right, y, { align: 'right' });

      y += 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('TOTAL', left, y);
      doc.text(this.formatMoney(this.totalGeneral()), right, y, { align: 'right' });

      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Reçu', left, y);
      doc.text(this.formatMoney(this.montantRecu || 0), right, y, { align: 'right' });

      y += 4;
      doc.text('Monnaie', left, y);
      doc.text(this.formatMoney(this.monnaie()), right, y, { align: 'right' });

      y += 5;
      doc.line(left, y, right, y);

      y += 5;
      doc.setFontSize(8);
      doc.text('Merci pour votre achat', center, y, { align: 'center' });

      y += 4;
      doc.text('Powered by PEACE POS', center, y, { align: 'center' });

      doc.save(`ticket-${this.ticketNumero}.pdf`);
    });
  }

  private truncate(text: string, maxLength: number): string {
    if (!text) return '';
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  }

  formatMoney(value: number | null | undefined): string {
    return this.arrondir2(this.toNumber(value)).toFixed(2);
  }

  private fusionnerProduitsAvecStock(produits: any[], stocks: any[]): any[] {
    const stockMap = new Map<number, any>();

    (stocks || []).forEach((s: any) => {
      const produitId = Number(
        s?.produitId ??
        s?.idProduit ??
        s?.produit?.id ??
        0
      );

      if (!produitId) return;

      const quantite = this.toNumber(
        s?.quantiteDisponible ??
        s?.stockDisponible ??
        s?.quantite ??
        s?.stock ??
        0
      );

      const pmp = this.toNumber(
        s?.pmp ??
        s?.prixMoyen ??
        s?.prixAchat ??
        0
      );

      const prixVenteUnitaire = this.toNumber(
        s?.prixVenteUnitaire ??
        s?.prixVente ??
        0
      );

      stockMap.set(produitId, {
        stock: quantite,
        pmp,
        prixVenteUnitaire
      });
    });

    return (produits || []).map((p: any) => {
      const stockData = stockMap.get(Number(p?.id)) || {};

      return {
        ...p,
        stock: this.toNumber(
          stockData?.stock ??
          p?.stock ??
          p?.quantiteDisponible ??
          0
        ),
        quantiteDisponible: this.toNumber(
          stockData?.stock ??
          p?.quantiteDisponible ??
          0
        ),
        pmp: this.toNumber(
          stockData?.pmp ??
          p?.pmp ??
          p?.prixAchat ??
          0
        ),
        prixVenteUnitaire: this.toNumber(
          stockData?.prixVenteUnitaire ??
          p?.prixVenteUnitaire ??
          p?.prixVente ??
          0
        )
      };
    });
  }

  private tarifierProduits(
    produits: any[],
    regles: any[],
    tarif: any | null
  ): ProduitTarifie[] {
    if (!tarif?.id) {
      return (produits || []).map((produit: any) => this.buildProduitSansTarif(produit));
    }

    const reglesActivesDuTarif = (regles || []).filter((regle: any) =>
      Number(regle?.tarifVenteId ?? regle?.tarifId) === Number(tarif.id) &&
      regle?.actif === true
    );

    const reglesMap = new Map<number, any>();
    reglesActivesDuTarif.forEach((regle: any) => {
      reglesMap.set(Number(regle?.categorieId), regle);
    });

    return (produits || []).map((produit: any) => {
      const regle = reglesMap.get(Number(produit?.categorieId)) || null;
      const remiseAuto = this.toNumber(regle?.tauxRemiseMax);
      return this.buildProduitTarifie(produit, tarif, regle, remiseAuto);
    });
  }

  private buildProduitSansTarif(produit: any): ProduitTarifie {
    const imagePrincipale = this.getImagePrincipale(produit);
    const base = this.resolveBaseTarification(produit);

    return {
      id: Number(produit?.id ?? 0),
      codeBarres: produit?.codeBarres ?? '',
      reference: produit?.reference ?? '',
      nom: produit?.nom ?? '',
      description: produit?.description ?? '',
      categorieId: Number(produit?.categorieId ?? 0),
      categorieNom: produit?.categorieNom ?? '',

      tarifId: null,
      tarifNom: null,
      tarifCode: null,

      regleTarifId: null,
      tauxMarge: 0,
      tauxRemiseMax: 0,
      tauxRemiseApplique: 0,
      montantRemise: 0,
      modeArrondi: null,

      baseTarification: base,
      prixBrut: base,
      prixNetAvantArrondi: base,
      prixFinal: base,
      prixUnitaire: base,

      prixVenteOriginal: this.toNumber(
        produit?.prixVenteUnitaire ??
        produit?.prixVente
      ),
      prixAchat: produit?.prixAchat ?? null,
      pmp: produit?.pmp ?? null,

      stock: this.toNumber(
        produit?.stock ??
        produit?.stockDisponible ??
        produit?.quantiteDisponible ??
        0
      ),
      stockMinimum: this.toNumber(produit?.stockMinimum),
      stockMaximum: this.toNumber(produit?.stockMaximum),
      actif: produit?.actif !== false,

      imagePrincipale,
      images: Array.isArray(produit?.images) ? produit.images : [],

      produitSource: produit,
      regleSource: null
    };
  }

  private buildProduitTarifie(
    produit: any,
    tarif: any,
    regle: any | null,
    remiseDemandee: number = 0
  ): ProduitTarifie {
    const imagePrincipale = this.getImagePrincipale(produit);

    const base = this.resolveBaseTarification(produit);
    const tauxMarge = this.toNumber(regle?.tauxMarge);
    const tauxRemiseMax = this.toNumber(regle?.tauxRemiseMax);
    const modeArrondi = regle?.modeArrondi ?? 'AUCUN';

    const prixBrut = base + (base * tauxMarge / 100);

    const tauxRemiseApplique = Math.min(
      Math.max(this.toNumber(remiseDemandee), 0),
      tauxRemiseMax
    );

    const montantRemise = this.arrondir2(prixBrut * tauxRemiseApplique / 100);
    const prixNetAvantArrondi = this.arrondir2(prixBrut - montantRemise);
    const prixFinal = this.appliquerArrondi(prixNetAvantArrondi, modeArrondi);

    return {
      id: Number(produit?.id ?? 0),
      codeBarres: produit?.codeBarres ?? '',
      reference: produit?.reference ?? '',
      nom: produit?.nom ?? '',
      description: produit?.description ?? '',
      categorieId: Number(produit?.categorieId ?? 0),
      categorieNom: produit?.categorieNom ?? '',

      tarifId: Number(tarif?.id ?? 0),
      tarifNom: tarif?.nom ?? '',
      tarifCode: tarif?.code ?? '',

      regleTarifId: regle ? Number(regle?.id ?? 0) : null,
      tauxMarge,
      tauxRemiseMax,
      tauxRemiseApplique,
      montantRemise,
      modeArrondi,

      baseTarification: base,
      prixBrut: this.arrondir2(prixBrut),
      prixNetAvantArrondi,
      prixFinal,
      prixUnitaire: prixFinal,

      prixVenteOriginal: this.toNumber(
        produit?.prixVenteUnitaire ??
        produit?.prixVente
      ),
      prixAchat: produit?.prixAchat ?? null,
      pmp: produit?.pmp ?? null,

      stock: this.toNumber(
        produit?.stock ??
        produit?.stockDisponible ??
        produit?.quantiteDisponible ??
        0
      ),
      stockMinimum: this.toNumber(produit?.stockMinimum),
      stockMaximum: this.toNumber(produit?.stockMaximum),
      actif: produit?.actif !== false,

      imagePrincipale,
      images: Array.isArray(produit?.images) ? produit.images : [],

      produitSource: produit,
      regleSource: regle
    };
  }

  private resolveBaseTarification(produit: any): number {
    const pmp = this.toNumber(
      produit?.pmp ??
      produit?.prixAchat ??
      produit?.prixVenteUnitaire ??
      produit?.prixVente ??
      0
    );

    if (pmp <= 0) {
      console.warn(`⚠️ Produit sans PMP : ${produit?.nom}`);
    }

    return pmp;
  }

  private appliquerArrondi(montant: number, mode: string): number {
    const valeur = this.toNumber(montant);

    switch ((mode || 'AUCUN').toUpperCase()) {
      case 'ENTIER_SUP':
        return Math.ceil(valeur);
      case 'ENTIER_INF':
        return Math.floor(valeur);
      default:
        return this.arrondir2(valeur);
    }
  }

  private getImagePrincipale(produit: any): string | null {
    if (!produit) return null;

    if (Array.isArray(produit?.images) && produit.images.length > 0) {
      const principale = produit.images.find((img: any) => img?.principale === true);
      return principale?.url || produit.images[0]?.url || null;
    }

    if (produit?.imagePrincipale) {
      return produit.imagePrincipale;
    }

    return null;
  }

  private toNumber(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    const n = Number(value);
    return Number.isNaN(n) ? 0 : n;
  }

  private arrondir2(value: number): number {
    return Number(this.toNumber(value).toFixed(2));
  }

  async demarrerScanAutoSilencieux(): Promise<void> {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        this.scanMessage = 'Caméra non supportée sur cet appareil';
        return;
      }

      this.stopScanAuto();

      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      const video = this.scannerVideoRef?.nativeElement;
      if (!video) {
        this.scanMessage = 'Zone vidéo non disponible';
        return;
      }

      video.srcObject = this.mediaStream;
      await video.play();

      this.scanAutoActif = true;
      this.scanMessage = 'Scan auto actif - présente le code-barres';

      this.lancerBoucleScan();
    } catch (error) {
      console.error('Erreur démarrage caméra', error);
      this.scanAutoActif = false;
      this.scanMessage = 'Impossible d’accéder à la caméra';
    }
  }

  toggleScanAuto(): void {
    if (this.scanAutoActif) {
      this.stopScanAuto();
    } else {
      this.demarrerScanAutoSilencieux();
    }
  }

  private lancerBoucleScan(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
    }

    this.scanInterval = setInterval(async () => {
      if (!this.scanAutoActif) return;

      const code = await this.lireCodeDepuisVideo();
      if (!code) return;

      const now = Date.now();
      if (this.lastScannedCode === code && now - this.lastScannedAt < 1800) {
        return;
      }

      this.lastScannedCode = code;
      this.lastScannedAt = now;

      this.traiterCodeScanne(code);
    }, 700);
  }

  private async lireCodeDepuisVideo(): Promise<string | null> {
    try {
      const video = this.scannerVideoRef?.nativeElement;
      if (!video || video.readyState < 2) return null;

      const DetectorCtor = (window as any).BarcodeDetector;
      if (!DetectorCtor) {
        this.scanMessage = 'BarcodeDetector non disponible dans ce navigateur';
        return null;
      }

      const detector = new DetectorCtor({
        formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e']
      });

      const barcodes = await detector.detect(video);
      if (!barcodes?.length) return null;

      const rawValue = barcodes[0]?.rawValue?.trim();
      return rawValue || null;
    } catch {
      return null;
    }
  }

  private traiterCodeScanne(code: string): void {
    const produit = this.produitsTarifies().find(p =>
      (p.codeBarres || '').trim().toLowerCase() === code.trim().toLowerCase()
    );

    if (!produit) {
      this.scanMessage = `Code non trouvé : ${code}`;
      return;
    }

    this.ajouterProduitTarifieAuPanier(produit, 1);
    this.scanMessage = `${produit.nom} ajouté au panier`;
  }

  private stopScanAuto(): void {
    this.scanAutoActif = false;

    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    const video = this.scannerVideoRef?.nativeElement;
    if (video) {
      video.pause();
      video.srcObject = null;
    }

    this.scanMessage = 'Scan arrêté';
  }

  payer(): void {
    if (!this.lignes().length) {
      this.toastr.error('Le panier est vide');
      return;
    }

    if (!this.selectedDepotId()) {
      this.toastr.error('Veuillez sélectionner un dépôt');
      return;
    }

    if (this.toNumber(this.montantRecu) < this.totalGeneral()) {
      this.toastr.error('Le montant reçu est insuffisant');
      return;
    }

    const payloadVente = {
      ticketNumero: this.ticketNumero,
      clientNom: this.clientNom,
      caissier: 'CAISSIER POS',
      modePaiement: this.modePaiement,
      montantRecu: this.toNumber(this.montantRecu),
      monnaie: this.monnaie(),
      sousTotal: this.sousTotal(),
      totalRemise: this.totalRemise(),
      totalGeneral: this.totalGeneral(),
      tarifId: this.selectedTarifId(),
      depotId: this.selectedDepotId(),
      lignes: this.lignes().map(l => ({
        produitId: l.produitId,
        quantite: l.quantite,
        prix: l.prix,
        remise: l.remise,
        total: this.ligneTotal(l)
      }))
    };

    this.venteStore.save(payloadVente).subscribe({
      next: (saved: any) => {
        console.log('Vente enregistrée :', saved);
        this.toastr.success(`Paiement validé - Ticket ${this.ticketNumero}`);
        this.imprimerTicketPDF();
        this.viderPanier();
        this.clientNom = '';
        this.modePaiement = 'CASH';
        this.montantRecu = null;
        this.initialiserTicket();
        this.route.navigateByUrl('/admin/pos/vente');
        this.initialiserVente();
      },
      error: (err) => {
        console.error(err);
        this.toastr.error(
          err?.error?.message || 'Erreur lors de l’enregistrement de la vente'
        );
      }
    });
  }
}
