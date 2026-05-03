import { Component, computed, ElementRef, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { Toast } from '../../../../shares/services/toast/toast';
import { TarifVenteStore } from '../../service/tarif/TarifVenteStore';
import { forkJoin, finalize } from 'rxjs';
import { ProduitStoreService } from '../../../produits/core/produit-store.service';
import { MatDialog } from '@angular/material/dialog';
import { ProduitPickerDialogComponent } from '../produit-picker-dialog-component/produit-picker-dialog-component';
import { ServiceStockStore } from '../../../stock/service/stock-service/service-stock.store';
import { VenteStore } from '../../service/VenteStore';
import { Router } from '@angular/router';
import { DepotStoreService } from '../../../stock/service/stock-service/DepotStoreService';
import { CaisseStoreService } from '../../../caisse/services/CaisseServiceStore';
import { VenteRequest, VenteResponse } from '../../../produits/models/vente.model';

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
  modeArrondi: string | null;

  baseTarification: number;
  baseTarificationCDF: number;
  baseTarificationUSD: number;

  prixBrut: number;
  prixBrutCDF: number;
  prixBrutUSD: number;

  montantRemise: number;
  montantRemiseCDF: number;
  montantRemiseUSD: number;

  prixNetAvantArrondi: number;
  prixNetAvantArrondiCDF: number;
  prixNetAvantArrondiUSD: number;

  prixFinal: number;
  prixFinalCDF: number;
  prixFinalUSD: number;

  prixUnitaire: number;
  prixUnitaireCDF: number;
  prixUnitaireUSD: number;

  tauxChangeUtilise: number;

  prixVenteOriginal?: number;
  prixVenteFc?: number | null;
  prixVenteUsd?: number | null;

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
  prixCDF: number;
  prixUSD: number;

  quantite: number;

  remise: number;
  remiseCDF: number;
  remiseUSD: number;

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

  tauxChange = signal<number>(0);

  devisePrincipale = 'CDF';
  deviseSecondaire = 'USD';

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
    private router: Router,
    private caisseStore: CaisseStoreService
  ) {}

  ngOnInit(): void {
    this.initialiserTicket();
    this.loadDernierTaux();
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

  private loadDernierTaux(): void {
    this.caisseStore.loadDernierTaux().subscribe({
      next: (taux: number) => {
        this.tauxChange.set(this.toNumber(taux));
        this.genererProduitsTarifies();
      },
      error: () => {
        this.tauxChange.set(0);
        this.toastr.error('Impossible de charger le dernier taux actif');
      }
    });
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
    this.genererProduitsTarifies();
  }

  getSelectedDepot(): any | null {
    const id = this.selectedDepotId();
    if (!id) return null;

    return this.depots().find((d: any) => Number(d?.id) === Number(id)) ?? null;
  }

  getSelectedDepotNom(): string {
    return this.getSelectedDepot()?.nom ?? '-';
  }

  getSelectedTarif(): any | null {
    const id = this.selectedTarifId();
    if (!id) return null;

    return this.tarifs().find((t: any) => Number(t?.id) === Number(id)) ?? null;
  }

  getSelectedTarifNom(): string {
    return this.getSelectedTarif()?.nom ?? '-';
  }

  onTarifChange(tarifId: number): void {
    this.selectedTarifId.set(tarifId);
    this.genererProduitsTarifies();
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
        remise: this.arrondir2(existing.produitTarifie.montantRemiseCDF * nouvelleQuantite),
        remiseCDF: this.arrondir2(existing.produitTarifie.montantRemiseCDF * nouvelleQuantite),
        remiseUSD: this.arrondir2(existing.produitTarifie.montantRemiseUSD * nouvelleQuantite)
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

      prix: produit.prixFinalCDF,
      prixCDF: produit.prixFinalCDF,
      prixUSD: produit.prixFinalUSD,

      quantite: qte,

      remise: this.arrondir2(produit.montantRemiseCDF * qte),
      remiseCDF: this.arrondir2(produit.montantRemiseCDF * qte),
      remiseUSD: this.arrondir2(produit.montantRemiseUSD * qte),

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
          remise: this.arrondir2(l.produitTarifie.montantRemiseCDF * quantite),
          remiseCDF: this.arrondir2(l.produitTarifie.montantRemiseCDF * quantite),
          remiseUSD: this.arrondir2(l.produitTarifie.montantRemiseUSD * quantite)
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
          remise: this.arrondir2(l.produitTarifie.montantRemiseCDF * quantite),
          remiseCDF: this.arrondir2(l.produitTarifie.montantRemiseCDF * quantite),
          remiseUSD: this.arrondir2(l.produitTarifie.montantRemiseUSD * quantite)
        };
      })
    );
  }

  ligneTotal(row: LignePanier): number {
    return this.arrondir2(
      this.toNumber(row.prixCDF) * this.toNumber(row.quantite) - this.toNumber(row.remiseCDF)
    );
  }

  ligneTotalUSD(row: LignePanier): number {
    return this.convertirCDFVersUSDByTaux(
      this.ligneTotal(row),
      row.produitTarifie.tauxChangeUtilise
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
      this.lignes().reduce((sum, l) => {
        return sum + this.toNumber(l.prixCDF) * this.toNumber(l.quantite);
      }, 0)
    );
  }

  sousTotalUSD(): number {
    return this.arrondir2(
      this.lignes().reduce((sum, l) => {
        const montantCDF = this.toNumber(l.prixCDF) * this.toNumber(l.quantite);
        return sum + this.convertirCDFVersUSDByTaux(
          montantCDF,
          l.produitTarifie.tauxChangeUtilise
        );
      }, 0)
    );
  }

  totalRemise(): number {
    return this.arrondir2(
      this.lignes().reduce((sum, l) => sum + this.toNumber(l.remiseCDF), 0)
    );
  }

  totalRemiseUSD(): number {
    return this.arrondir2(
      this.lignes().reduce((sum, l) => sum + this.toNumber(l.remiseUSD), 0)
    );
  }

  totalGeneral(): number {
    return this.arrondir2(this.sousTotal() - this.totalRemise());
  }

  totalGeneralUSD(): number {
    return this.arrondir2(this.sousTotalUSD() - this.totalRemiseUSD());
  }

  monnaie(): number {
    return this.arrondir2(this.toNumber(this.montantRecu) - this.totalGeneral());
  }

  montantRecuUSD(): number {
    return this.convertirCDFVersUSD(this.toNumber(this.montantRecu));
  }

  monnaieUSD(): number {
    return this.convertirCDFVersUSD(this.monnaie());
  }

  alertesStock(): string[] {
    return this.lignes()
      .filter(l => this.toNumber(l.stock) > 0 && this.toNumber(l.quantite) > this.toNumber(l.stock))
      .map(l => `${l.produit} : quantité demandée supérieure au stock disponible (${l.stock})`);
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

      const depotSelectionne = this.selectedDepotId();

      if (depotSelectionne && Number(s?.depotId) !== Number(depotSelectionne)) {
        return;
      }

      stockMap.set(produitId, {
        stock: this.toNumber(s?.quantiteDisponible ?? 0),
        pmp: this.toNumber(s?.pmp ?? 0),
        pmpFc: this.toNumber(s?.pmpFc ?? s?.pmp ?? 0),
        pmpUsd: this.toNumber(s?.pmpUsd ?? 0),
        tauxChangeUtilise: this.toNumber(s?.tauxChangeUtilise ?? 0),
        prixVenteUnitaire: this.toNumber(s?.prixVenteUnitaire ?? 0),
        depotId: this.toNumber(s?.depotId ?? 0),
        depotNom: s?.nomDepot ?? s?.depotNom ?? ''
      });
    });

    return (produits || []).map((p: any) => {
      const stockData = stockMap.get(Number(p?.id)) || {};
      const tauxStock = this.toNumber(stockData?.tauxChangeUtilise);
      const tauxGlobal = this.toNumber(this.tauxChange());

      return {
        ...p,

        stock: this.toNumber(stockData?.stock ?? 0),
        quantiteDisponible: this.toNumber(stockData?.stock ?? 0),

        pmp: this.toNumber(stockData?.pmp ?? 0),
        pmpFc: this.toNumber(stockData?.pmpFc ?? stockData?.pmp ?? 0),
        pmpUsd: this.toNumber(stockData?.pmpUsd ?? 0),

        tauxChangeUtilise: tauxStock > 0 ? tauxStock : tauxGlobal,

        prixVenteUnitaire: this.toNumber(stockData?.prixVenteUnitaire ?? 0),
        depotId: stockData?.depotId ?? null,
        depotNom: stockData?.depotNom ?? ''
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
    const taux = this.getTauxProduit(produit);

    const baseCDF = this.resolveBaseTarification(produit);
    const baseUSD = this.convertirCDFVersUSDByTaux(baseCDF, taux);

    return {
      id: Number(produit?.id ?? 0),
      codeBarres: produit?.codeBarres ?? produit?.codeBarre ?? '',
      reference: produit?.reference ?? '',
      nom: produit?.nom ?? produit?.nomProduit ?? '',
      description: produit?.description ?? '',

      categorieId: Number(produit?.categorieId ?? 0),
      categorieNom: produit?.categorieNom ?? produit?.categorie ?? '',

      tarifId: null,
      tarifNom: null,
      tarifCode: null,

      regleTarifId: null,
      tauxMarge: 0,
      tauxRemiseMax: 0,
      tauxRemiseApplique: 0,
      modeArrondi: null,

      baseTarification: baseCDF,
      baseTarificationCDF: baseCDF,
      baseTarificationUSD: baseUSD,

      prixBrut: baseCDF,
      prixBrutCDF: baseCDF,
      prixBrutUSD: baseUSD,

      montantRemise: 0,
      montantRemiseCDF: 0,
      montantRemiseUSD: 0,

      prixNetAvantArrondi: baseCDF,
      prixNetAvantArrondiCDF: baseCDF,
      prixNetAvantArrondiUSD: baseUSD,

      prixFinal: baseCDF,
      prixFinalCDF: baseCDF,
      prixFinalUSD: baseUSD,

      prixUnitaire: baseCDF,
      prixUnitaireCDF: baseCDF,
      prixUnitaireUSD: baseUSD,

      tauxChangeUtilise: taux,

      prixVenteOriginal: this.toNumber(
        produit?.prixVenteFc ??
        produit?.prixVenteUnitaire ??
        produit?.prixVente
      ),

      prixVenteFc: produit?.prixVenteFc ?? produit?.prixVente ?? null,
      prixVenteUsd: produit?.prixVenteUsd ?? null,

      prixAchat: produit?.prixAchat ?? null,
      pmp: produit?.pmpFc ?? produit?.pmp ?? null,

      stock: this.toNumber(produit?.stock ?? produit?.quantiteDisponible ?? 0),
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
    const taux = this.getTauxProduit(produit);

    const baseCDF = this.resolveBaseTarification(produit);
    const baseUSD = this.convertirCDFVersUSDByTaux(baseCDF, taux);

    const tauxMarge = this.toNumber(regle?.tauxMarge);
    const tauxRemiseMax = this.toNumber(regle?.tauxRemiseMax);
    const modeArrondi = regle?.modeArrondi ?? 'AUCUN';

    const prixBrutCDF = this.arrondir2(baseCDF + (baseCDF * tauxMarge / 100));

    const tauxRemiseApplique = Math.min(
      Math.max(this.toNumber(remiseDemandee), 0),
      tauxRemiseMax
    );

    const montantRemiseCDF = this.arrondir2(prixBrutCDF * tauxRemiseApplique / 100);
    const prixNetAvantArrondiCDF = this.arrondir2(prixBrutCDF - montantRemiseCDF);
    const prixFinalCDF = this.appliquerArrondi(prixNetAvantArrondiCDF, modeArrondi);

    return {
      id: Number(produit?.id ?? 0),
      codeBarres: produit?.codeBarres ?? produit?.codeBarre ?? '',
      reference: produit?.reference ?? '',
      nom: produit?.nom ?? produit?.nomProduit ?? '',
      description: produit?.description ?? '',

      categorieId: Number(produit?.categorieId ?? 0),
      categorieNom: produit?.categorieNom ?? produit?.categorie ?? '',

      tarifId: Number(tarif?.id ?? 0),
      tarifNom: tarif?.nom ?? '',
      tarifCode: tarif?.code ?? '',

      regleTarifId: regle ? Number(regle?.id ?? 0) : null,

      tauxMarge,
      tauxRemiseMax,
      tauxRemiseApplique,
      modeArrondi,

      baseTarification: baseCDF,
      baseTarificationCDF: baseCDF,
      baseTarificationUSD: baseUSD,

      prixBrut: prixBrutCDF,
      prixBrutCDF,
      prixBrutUSD: this.convertirCDFVersUSDByTaux(prixBrutCDF, taux),

      montantRemise: montantRemiseCDF,
      montantRemiseCDF,
      montantRemiseUSD: this.convertirCDFVersUSDByTaux(montantRemiseCDF, taux),

      prixNetAvantArrondi: prixNetAvantArrondiCDF,
      prixNetAvantArrondiCDF,
      prixNetAvantArrondiUSD: this.convertirCDFVersUSDByTaux(prixNetAvantArrondiCDF, taux),

      prixFinal: prixFinalCDF,
      prixFinalCDF,
      prixFinalUSD: this.convertirCDFVersUSDByTaux(prixFinalCDF, taux),

      prixUnitaire: prixFinalCDF,
      prixUnitaireCDF: prixFinalCDF,
      prixUnitaireUSD: this.convertirCDFVersUSDByTaux(prixFinalCDF, taux),

      tauxChangeUtilise: taux,

      prixVenteOriginal: this.toNumber(
        produit?.prixVenteFc ??
        produit?.prixVenteUnitaire ??
        produit?.prixVente
      ),

      prixVenteFc: produit?.prixVenteFc ?? produit?.prixVente ?? null,
      prixVenteUsd: produit?.prixVenteUsd ?? null,

      prixAchat: produit?.prixAchat ?? null,
      pmp: produit?.pmpFc ?? produit?.pmp ?? null,

      stock: this.toNumber(produit?.stock ?? produit?.quantiteDisponible ?? 0),
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
    const baseFc = this.toNumber(
      produit?.pmpFc ??
      produit?.pmp ??
      produit?.prixAchatFc ??
      produit?.prixAchat ??
      produit?.prixVenteUnitaire ??
      produit?.prixVente ??
      0
    );

    if (baseFc <= 0) {
      console.warn(`Produit sans PMP FC : ${produit?.nom ?? produit?.nomProduit}`);
    }

    return baseFc;
  }

  private getTauxProduit(produit: any): number {
    const tauxStock = this.toNumber(produit?.tauxChangeUtilise);

    if (tauxStock > 0) {
      return tauxStock;
    }

    return this.toNumber(this.tauxChange());
  }

  convertirCDFVersUSD(montantCDF: number): number {
    const taux = this.toNumber(this.tauxChange());

    if (taux <= 0) return 0;

    return this.arrondir2(this.toNumber(montantCDF) / taux);
  }

  convertirUSDVersCDF(montantUSD: number): number {
    const taux = this.toNumber(this.tauxChange());

    if (taux <= 0) return 0;

    return this.arrondir2(this.toNumber(montantUSD) * taux);
  }

  convertirCDFVersUSDByTaux(montantCDF: number, taux: number): number {
    const t = this.toNumber(taux);

    if (t <= 0) return 0;

    return this.arrondir2(this.toNumber(montantCDF) / t);
  }

  private appliquerArrondi(montant: number, mode: string): number {
    const valeur = this.toNumber(montant);

    switch ((mode || 'AUCUN').toUpperCase()) {
      case 'ENTIER_SUP':
        return Math.ceil(valeur);
      case 'ENTIER_INF':
        return Math.floor(valeur);
      case 'MULTIPLE_10':
        return Math.ceil(valeur / 10) * 10;
      case 'MULTIPLE_50':
        return Math.ceil(valeur / 50) * 50;
      case 'MULTIPLE_100':
        return Math.ceil(valeur / 100) * 100;
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

    const tauxGlobal = this.toNumber(this.tauxChange());

    if (tauxGlobal <= 0) {
      this.toastr.error('Aucun taux actif trouvé. Veuillez enregistrer un taux avant la vente.');
      return;
    }

    const payloadVente: VenteRequest = {
      ticketNumero: this.ticketNumero,
      clientNom: this.clientNom || 'Comptoir',
      caissier: 'CAISSIER POS',
      depotId: this.selectedDepotId() as number,
      modePaiement: this.modePaiement,

      devise: 'CDF',
      tauxChange: tauxGlobal,

      montantRecu: this.toNumber(this.montantRecu),
      monnaie: this.monnaie(),
      sousTotal: this.sousTotal(),
      totalRemise: this.totalRemise(),
      totalGeneral: this.totalGeneral(),

      sousTotalCDF: this.sousTotal(),
      totalRemiseCDF: this.totalRemise(),
      totalGeneralCDF: this.totalGeneral(),
      montantRecuCDF: this.toNumber(this.montantRecu),
      monnaieCDF: this.monnaie(),

      sousTotalUSD: this.sousTotalUSD(),
      totalRemiseUSD: this.totalRemiseUSD(),
      totalGeneralUSD: this.totalGeneralUSD(),
      montantRecuUSD: this.montantRecuUSD(),
      monnaieUSD: this.monnaieUSD(),

      tarifId: this.selectedTarifId(),

      lignes: this.lignes().map(l => {
        const totalLigneCDF = this.ligneTotal(l);
        const totalLigneUSD = this.ligneTotalUSD(l);

        return {
          produitId: l.produitId,
          quantite: l.quantite,

          prix: l.prixCDF,
          remise: l.remiseCDF,
          total: totalLigneCDF,

          prixCDF: l.prixCDF,
          remiseCDF: l.remiseCDF,
          totalCDF: totalLigneCDF,

          prixUSD: l.prixUSD,
          remiseUSD: l.remiseUSD,
          totalUSD: totalLigneUSD,

          tauxChangeUtilise: l.produitTarifie.tauxChangeUtilise
        };
      })
    };

    this.venteStore.save(payloadVente).subscribe({
      next: (saved: VenteResponse) => {
        this.toastr.success(`Paiement validé - Ticket ${saved.ticketNumero}`);

        this.imprimerTicketPDF();

        this.viderPanier();
        this.clientNom = '';
        this.modePaiement = 'CASH';
        this.montantRecu = null;
        this.initialiserTicket();

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

  imprimerTicketPDF(): void {
    const lignesTicket = [...this.lignes()];
    const ticketNumero = this.ticketNumero;
    const clientNom = this.clientNom || 'Comptoir';
    const modePaiement = this.modePaiement || 'CASH';
    const montantRecu = this.toNumber(this.montantRecu);

    const sousTotal = this.sousTotal();
    const totalRemise = this.totalRemise();
    const totalGeneral = this.totalGeneral();
    const monnaie = this.arrondir2(montantRecu - totalGeneral);

    if (!lignesTicket.length) {
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
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Ticket : ${ticketNumero}`, center, y, { align: 'center' });

      y += 4;
      doc.text(new Date().toLocaleString('fr-FR'), center, y, { align: 'center' });

      y += 4;
      doc.text(`Client : ${clientNom}`, center, y, { align: 'center' });

      y += 4;
      doc.text(`Paiement : ${modePaiement}`, center, y, { align: 'center' });

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

      lignesTicket.forEach(l => {
        ensureSpace(12);

        const prix = this.toNumber(l.prixCDF);
        const remise = this.toNumber(l.remiseCDF);
        const totalLigne = this.ligneTotal(l);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(this.truncate(l.produit, 22), left, y);

        y += 3.5;

        doc.setFont('helvetica', 'normal');
        doc.text(`${l.quantite}`, 40, y, { align: 'right' });
        doc.text(this.formatFC(prix).replace(' FC', ''), 56, y, { align: 'right' });
        doc.text(this.formatFC(totalLigne).replace(' FC', ''), right, y, { align: 'right' });

        y += 4;

        if (remise > 0) {
          ensureSpace(4);
          doc.setFontSize(7);
          doc.text(`Remise : ${this.formatFC(remise)}`, right, y, { align: 'right' });
          y += 3.5;
        }
      });

      ensureSpace(30);

      y += 1;
      doc.line(left, y, right, y);

      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Sous-total', left, y);
      doc.text(this.formatFC(sousTotal), right, y, { align: 'right' });

      y += 4;
      doc.text('Remise', left, y);
      doc.text(this.formatFC(totalRemise), right, y, { align: 'right' });

      y += 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('TOTAL', left, y);
      doc.text(this.formatFC(totalGeneral), right, y, { align: 'right' });

      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(`Equivalent : ${this.formatUSD(this.totalGeneralUSD())}`, right, y, {
        align: 'right'
      });

      y += 5;
      doc.setFontSize(8);
      doc.text('Reçu', left, y);
      doc.text(this.formatFC(montantRecu), right, y, { align: 'right' });

      y += 4;
      doc.text('Monnaie', left, y);
      doc.text(this.formatFC(monnaie), right, y, { align: 'right' });

      y += 5;
      doc.line(left, y, right, y);

      y += 5;
      doc.setFontSize(8);
      doc.text('Merci pour votre achat', center, y, { align: 'center' });

      y += 4;
      doc.text('Powered by PEACE POS', center, y, { align: 'center' });

      doc.save(`ticket-${ticketNumero}.pdf`);
    });
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

  formatTauxProduit(produit: ProduitTarifie | any): string {
    const taux = this.toNumber(produit?.tauxChangeUtilise);
    return taux > 0 ? `1 USD = ${this.formatFC(taux)}` : 'Taux non défini';
  }

  formatSecondaryUSD(value: number | null | undefined): string {
    return `≈ ${this.formatUSD(value)}`;
  }

  formatFC(value: number | null | undefined): string {
    return `${this.arrondir2(this.toNumber(value)).toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })} FC`;
  }

  formatUSD(value: number | null | undefined): string {
    return `${this.arrondir2(this.toNumber(value)).toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} USD`;
  }

  formatMoney(value: number | null | undefined): string {
    return this.arrondir2(this.toNumber(value)).toFixed(2);
  }

  private truncate(text: string, maxLength: number): string {
    if (!text) return '';

    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  }

  private toNumber(value: any): number {
    if (value === null || value === undefined || value === '') return 0;

    const n = Number(value);

    return Number.isNaN(n) ? 0 : n;
  }

  private arrondir2(value: number): number {
    return Number(this.toNumber(value).toFixed(2));
  }
}
