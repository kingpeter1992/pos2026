import { Injectable, computed, inject, signal } from "@angular/core";
import { BehaviorSubject, catchError, finalize, map, Observable, of, shareReplay, tap } from "rxjs";
import { ProduitService } from "../../produits/service/produit-service/produit-service";
import { Toast } from "../../../shares/services/toast/toast";
import { VenteApiService } from "./vente-api-service";
import { VenteRequest, VenteResponse } from "../../produits/models/vente.model";
import { RapportVenteFilterRequest, RapportVentePosResponse } from "../../produits/models/rapport-vente-pos.model";

@Injectable({
  providedIn: 'root'
})
export class VenteStore {


  private readonly produitApi = inject(ProduitService);
  private readonly venteApi = inject(VenteApiService);
  private readonly venteService = inject(VenteApiService);
  private readonly toastr = inject(Toast);


  private readonly produitsSubject = new BehaviorSubject<any[]>([]);
  readonly produits$ = this.produitsSubject.asObservable();

  private readonly panierSubject = new BehaviorSubject<any[]>([]);
  readonly panier$ = this.panierSubject.asObservable();

  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  readonly loading$ = this.loadingSubject.asObservable();

  private readonly errorSubject = new BehaviorSubject<string | null>(null);
  readonly error$ = this.errorSubject.asObservable();

  private readonly alertesStockSubject = new BehaviorSubject<string[]>([]);
  readonly alertesStock$ = this.alertesStockSubject.asObservable();

  private readonly venteSuccessSubject = new BehaviorSubject<any | null>(null);
  readonly venteSuccess$ = this.venteSuccessSubject.asObservable();



  private rapportSubject = new BehaviorSubject<RapportVentePosResponse | null>(null);
  private loadingRapportSubject = new BehaviorSubject<boolean>(false);

  rapport$ = this.rapportSubject.asObservable();
  loadingRapport$ = this.loadingRapportSubject.asObservable();



  private produitsLoaded = false;
  private loadingInProgress = false;

loadProduits(force = false): Observable<any[]> {
  if (this.loadingInProgress) {
    return this.produits$;
  }

  if (this.produitsLoaded && !force) {
    return of(this.produitsSubject.value);
  }

  this.loadingInProgress = true;
  this.loadingSubject.next(true);
  this.errorSubject.next(null);

  return this.produitApi.getProduitsPos().pipe(
    map((data: any[]) => (data || []).map((p) => this.mapProduit(p))),
    tap((produits) => {
      this.produitsSubject.next(produits);
      this.detecterAlertesStock(produits);
      this.produitsLoaded = true;
      console.log('Produits => ', produits);
    }),
    catchError((err) => {
      this.errorSubject.next(
        err?.error?.message || 'Erreur de chargement des produits.'
      );
      this.produitsSubject.next([]);
      return of([]);
    }),
    finalize(() => {
      this.loadingSubject.next(false);
      this.loadingInProgress = false;
    })
  );
}

  refreshProduits(): void {
    this.loadProduits(true);
  }

  get produitsSnapshot(): any[] {
    return this.produitsSubject.value;
  }

  get panierSnapshot(): any[] {
    return this.panierSubject.value;
  }

  ajouterAuPanier(produit: any, quantite: number = 1): { ok: boolean; message?: string } {
    if (!produit) {
      return { ok: false, message: 'Produit invalide.' };
    }

    const stock = this.getStockValue(produit);
    const qty = Math.max(1, this.toNumber(quantite || 1));

    if (stock <= 0) {
      return { ok: false, message: 'Produit en rupture de stock.' };
    }

    const panier = [...this.panierSubject.value];
    const exist = panier.find((l) => Number(l.produitId) === Number(produit.id));

    if (exist) {
      const nouvelleQuantite = this.toNumber(exist.quantite) + qty;

      if (nouvelleQuantite > stock) {
        return { ok: false, message: 'Stock insuffisant pour ce produit.' };
      }

      exist.quantite = nouvelleQuantite;
      exist.stock = stock;
      exist.stockDisponible = stock;
      exist.quantiteDisponible = stock;

      if (!this.toNumber(exist.prixUnitaire)) {
        exist.prixUnitaire = this.getPrixProduit(produit);
      }

      if (!this.toNumber(exist.prix)) {
        exist.prix = this.getPrixProduit(produit);
      }
    } else {
      if (qty > stock) {
        return { ok: false, message: 'Quantité supérieure au stock disponible.' };
      }

      const prix = this.getPrixProduit(produit);

      panier.unshift({
        id: Date.now() + Math.floor(Math.random() * 1000),
        produitId: produit.id,
        produit: produit.nom ?? produit.designation ?? 'Produit',
        designation: produit.designation ?? produit.nom ?? 'Produit',
        codeBarres: produit.codeBarres || produit.codebarre || '',
        reference: produit.reference || '',
        prix: prix,
        prixUnitaire: prix,
        prixNet: this.toNumber(produit.prixNet ?? prix),
        quantite: qty,
        remise: 0,
        montantRemise: this.toNumber(produit.montantRemise),
        stock: stock,
        stockDisponible: stock,
        quantiteDisponible: stock,
        stockSecurite: this.toNumber(produit.stockSecurite || 0),
        imageUrl: produit.imageUrl || produit.image || '',

        tarifVenteId: produit.tarifVenteId,
        tarifCode: produit.tarifCode,
        tarifNom: produit.tarifNom,

        pmp: this.toNumber(produit.pmp),
        tauxMarge: this.toNumber(produit.tauxMarge),
        tauxRemiseMax: this.toNumber(produit.tauxRemiseMax),
        tauxRemiseAppliquee: this.toNumber(produit.tauxRemiseAppliquee),
        prixBrut: this.toNumber(produit.prixBrut)
      });
    }

    this.panierSubject.next(panier);
    return { ok: true };
  }

  ajouterLigneTarifiee(ligne: any): { ok: boolean; message?: string } {
    if (!ligne) {
      return { ok: false, message: 'Ligne invalide.' };
    }

    const stock = this.getStockValue(ligne);
    const qty = Math.max(1, this.toNumber(ligne.quantite || 1));

    if (stock <= 0) {
      return { ok: false, message: 'Produit en rupture de stock.' };
    }

    const panier = [...this.panierSubject.value];
    const exist = panier.find((l) => Number(l.produitId) === Number(ligne.produitId));

    if (exist) {
      const nouvelleQuantite = this.toNumber(exist.quantite) + qty;

      if (nouvelleQuantite > stock) {
        return { ok: false, message: 'Stock insuffisant pour ce produit.' };
      }

      exist.quantite = nouvelleQuantite;
      exist.stock = stock;
      exist.stockDisponible = stock;
      exist.quantiteDisponible = stock;
    } else {
      if (qty > stock) {
        return { ok: false, message: 'Quantité supérieure au stock disponible.' };
      }

      panier.unshift({
        ...ligne,
        id: Date.now() + Math.floor(Math.random() * 1000),
        stock: stock,
        stockDisponible: stock,
        quantiteDisponible: stock,
        quantite: qty,
        prix: this.toNumber(ligne.prix ?? ligne.prixUnitaire ?? ligne.prixNet),
        prixUnitaire: this.toNumber(ligne.prixUnitaire ?? ligne.prixNet ?? ligne.prix),
        prixNet: this.toNumber(ligne.prixNet ?? ligne.prixUnitaire ?? ligne.prix),
        remise: this.toNumber(ligne.remise),
        montantRemise: this.toNumber(ligne.montantRemise)
      });
    }

    this.panierSubject.next(panier);
    return { ok: true };
  }

  incrementerQuantite(ligneId: number): { ok: boolean; message?: string } {
    const panier = [...this.panierSubject.value];
    const ligne = panier.find((l) => Number(l.id) === Number(ligneId));

    if (!ligne) {
      return { ok: false, message: 'Ligne introuvable.' };
    }

    const stock = this.getStockValue(ligne);
    const quantiteActuelle = this.toNumber(ligne.quantite);

    if (quantiteActuelle + 1 > stock) {
      return { ok: false, message: 'Stock insuffisant pour augmenter cette ligne.' };
    }

    ligne.quantite = quantiteActuelle + 1;
    this.panierSubject.next(panier);
    return { ok: true };
  }

  decrementerQuantite(ligneId: number): void {
    const panier = this.panierSubject.value.map((item) =>
      Number(item.id) === Number(ligneId)
        ? { ...item, quantite: this.toNumber(item.quantite) > 1 ? this.toNumber(item.quantite) - 1 : 1 }
        : item
    );

    this.panierSubject.next(panier);
  }

  supprimerLigne(ligneId: number): void {
    this.panierSubject.next(
      this.panierSubject.value.filter((x) => Number(x.id) !== Number(ligneId))
    );
  }

  viderPanier(): void {
    this.panierSubject.next([]);
  }

  enregistrerVente(
    caissier: string,
    modePaiement: 'CASH' | 'MOBILE_MONEY' | 'CARTE' | 'VIREMENT'
  ): void {
    const lignes = this.panierSubject.value;

    if (!lignes.length) {
      this.errorSubject.next('Le panier est vide.');
      return;
    }

    const request: any = {
      caissier,
      modePaiement,
      lignes: lignes.map((l) => ({
        produitId: l.produitId,
        quantite: this.toNumber(l.quantite)
      }))
    };

    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.venteApi.save(request).pipe(
      finalize(() => this.loadingSubject.next(false))
    ).subscribe({
      next: (vente) => {
        this.venteSuccessSubject.next(vente);
        this.viderPanier();
        this.refreshProduits();
      },
      error: (err) => {
        this.errorSubject.next(
          err?.error?.message || 'Erreur lors de l’enregistrement de la vente.'
        );
      }
    });
  }

  private detecterAlertesStock(produits: any[]): void {
    const alertes = produits
      .filter((p) => {
        const stock = this.getStockValue(p);
        const stockSecurite = this.toNumber(p.stockSecurite || p.stockMinimum || 0);
        return stockSecurite > 0 && stock <= stockSecurite;
      })
      .map((p) => {
        const stock = this.getStockValue(p);
        return `Stock de sécurité atteint pour ${p.nom} (stock: ${stock})`;
      });

    this.alertesStockSubject.next(alertes);
  }

  private mapProduit(p: any): any {
    const imageUrl =
      p?.imageUrl ||
      p?.image ||
      p?.photoUrl ||
      (Array.isArray(p?.images) && p.images.length
        ? (p.images.find((img: any) => img?.principale)?.url ?? p.images[0]?.url ?? '')
        : '');

    const stock = this.toNumber(
      p?.stockDisponible ?? p?.quantiteDisponible ?? p?.stock ?? 0
    );

    const prixVente = this.toNumber(
      p?.prixUnitaire ?? p?.prixNet ?? p?.prixVente ?? p?.prix ?? 0
    );

    return {
      id: this.toNumber(p?.id ?? 0),
      nom: p?.nom ?? p?.designation ?? p?.libelle ?? 'Produit sans nom',
      designation: p?.designation ?? p?.nom ?? p?.libelle ?? 'Produit sans nom',
      codeBarres: p?.codeBarres ?? p?.codebarre ?? '',
      reference: p?.reference ?? '',
      prixVente: prixVente,
      prixUnitaire: prixVente,
      prixNet: this.toNumber(p?.prixNet ?? prixVente),
      stock: stock,
      stockDisponible: stock,
      quantiteDisponible: stock,
      stockSecurite: this.toNumber(p?.stockSecurite ?? p?.stockMinimum ?? 0),
      pmp: this.toNumber(p?.pmp ?? 0),
      imageUrl,
      actif: p?.actif ?? true,

      categorieId: p?.categorieId,
      categorieNom: p?.categorieNom,

      tarifVenteId: p?.tarifVenteId,
      tarifCode: p?.tarifCode,
      tarifNom: p?.tarifNom,

      tauxMarge: this.toNumber(p?.tauxMarge ?? 0),
      tauxRemiseMax: this.toNumber(p?.tauxRemiseMax ?? 0),
      tauxRemiseAppliquee: this.toNumber(p?.tauxRemiseAppliquee ?? 0),
      prixBrut: this.toNumber(p?.prixBrut ?? 0),
      montantRemise: this.toNumber(p?.montantRemise ?? 0)
    };
  }

  private getStockValue(source: any): number {
    return this.toNumber(
      source?.stockDisponible ?? source?.quantiteDisponible ?? source?.stock ?? 0
    );
  }

  private getPrixProduit(source: any): number {
    return this.toNumber(
      source?.prixUnitaire ?? source?.prixNet ?? source?.prixVente ?? source?.prix ?? 0
    );
  }

  private toNumber(value: any): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }


  // ===== STATE =====
  private readonly _items = signal<any[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _loaded = signal<boolean>(false);

    ventes = signal<any[]>([]);

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly loaded = this._loaded.asReadonly();

  readonly total = computed(() => this._items().length);

  private request$: Observable<any[]> | null = null;


  // ===== LOAD =====
  load(force = false): Observable<any[]> {

    // Si déjà chargé et pas forcé
    if (this._loaded() && !force) {
      return of(this._items());
    }
    // Si une requête est déjà en cours
    if (this.request$ && !force) {
      return this.request$;
    }
    this._loading.set(true);
    this.request$ = this.venteService.getAll().pipe(
      tap((data) => {
        this._items.set(Array.isArray(data) ? data : []);
        this._loaded.set(true);
        console.log('Vente => ', data);
      }),
      finalize(() => {
        this._loading.set(false);
        this.request$ = null;
      }),
      shareReplay(1)
    );

    return this.request$;
  }

  // ===== LOAD IF NEEDED =====
  loadIfNeeded(): Observable<any[]> {
    if (this._loaded()) {
      return of(this._items());
    }
    return this.load();
  }

  // ===== REFRESH =====
  refresh(): Observable<any[]> {
    return this.load(true);
  }

  // ===== SAVE =====
save(payload: VenteRequest): Observable<VenteResponse> {
  this._loading.set(true);

  return this.venteService.save(payload).pipe(
    tap((saved: VenteResponse) => {
      if (saved) {
        this._items.set([saved, ...this._items()]);
        this._loaded.set(true);
      }
    }),
    finalize(() => this._loading.set(false))
  );
}

  // ===== UTILS =====
  clear(): void {
    this._items.set([]);
    this._loaded.set(false);
  }
annulerVente(id: number, commentaire: string): Observable<any> {
  this._loading.set(true);

  return this.venteService.annulerVente(id, commentaire).pipe(
    tap(() => {
      this.refresh().subscribe();
    }),
    finalize(() => this._loading.set(false)),
    catchError((err) => {
  this.toastr.error(
    err?.error?.message || err?.message || 'Erreur lors du retour de vente.'
  );
      return of(null);
    })
  );
}

 get rapportValue(): RapportVentePosResponse | null {
    return this.rapportSubject.value;
  }

getRapportVentes(
  dateFrom: string,
  dateTo: string,
  depotId?: number | null,
  categorieId?: number | null,
  tarifId?: number | null,
  caissier?: string | null,
  devise?: string | null
): Observable<RapportVentePosResponse> {

  const filter: RapportVenteFilterRequest = {
    dateDebut: `${dateFrom}T00:00:00`,
    dateFin: `${dateTo}T23:59:59`,
    depotId: depotId ?? null,
    categorieId: categorieId ?? null,
    tarifId: tarifId ?? null,
    caissier: caissier ?? null,
    devise: devise ?? null
  };

  return this.venteService.getRapportVentes(filter);
}

  clearRapport(): void {
    this.rapportSubject.next(null);
  }


}
