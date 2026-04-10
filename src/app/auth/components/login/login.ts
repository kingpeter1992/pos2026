import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, finalize, forkJoin, Observable, of, switchMap } from 'rxjs';
import { LoaderService } from '../../../shares/services/loader/loader-service';
import { StorageService } from '../../services/storage/storage-service';
import {  AuthService } from '../../services/auth/auth-service';
import { Toast } from '../../../shares/services/toast/toast';
import { TarifVenteStore } from '../../../admin/pos/service/tarif/TarifVenteStore';
import { ServiceStockStore } from '../../../admin/stock/service/stock-service/service-stock.store';
import { CategorieStoreService } from '../../../admin/produits/core/categorie-store.service';
import { ProduitStoreService } from '../../../admin/produits/core/produit-store.service';
import { CommandeAchatStore } from '../../../admin/achats/service/achat/CommandeAchatStore';
import { DepotStore } from '../../../admin/achats/service/deposervice/DepotStore';
import { FournisseurStore } from '../../../admin/achats/service/facturefoiunrisseur/FournisseurStore';
import { ReceptionAchatStore } from '../../../admin/achats/service/reception/ReceptionAchatStore';
import { ServiceMouvementStockStore } from '../../../admin/stock/service/mouvement/ServiceMouvementStockStore';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.css',
  standalone: false
})
export class Login implements  OnInit {

 form: any = {
    username: null,
    password: null
  };

  isLoggedIn = false;
  isLoginFailed = false;
  errorMessage = '';
  roles: string[] = [];
  loading$: Observable<boolean> | undefined;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private loadingService: LoaderService,
    private storageService: StorageService,
    private toastr: Toast,
    private _dao: AuthService,
    private route: Router,

    /* ====== injecte ici tes stores ====== */
    private tarifVenteStore: TarifVenteStore,
    private categorieStore: CategorieStoreService,
    private stockStore: ServiceStockStore,
    private produitStore: ProduitStoreService,
    private fournisseurStore:FournisseurStore,
     private depotStore: DepotStore,
     private commandeAchatStore: CommandeAchatStore,
     private receptionAchatStore: ReceptionAchatStore,
     private mvntStore :ServiceMouvementStockStore
  ) {}

  ngOnInit(): void {
    this.loading$ = this.loadingService.loading$;

    if (this.storageService.isLoggedIn()) {
      this.isLoggedIn = true;
      this.roles = this.storageService.getUser().roles ?? [];
    }
  }

  onSubmit(): void {
    const { username, password } = this.form;

    if (!username || !password) {
      this.toastr.error('Veuillez saisir le nom d’utilisateur et le mot de passe.');
      return;
    }

    this.loading = true;
    this.isLoginFailed = false;
    this.errorMessage = '';

    this._dao.login(username, password)
      .pipe(
        catchError((err) => {
          this.errorMessage =
            err?.error?.message ||
            err?.message ||
            'Erreur de connexion.';
          this.isLoginFailed = true;
          this.toastr.error(this.errorMessage);
          return of(null);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe((data) => {
        if (!data) return;

        this.storageService.saveUser(data);
        this.isLoggedIn = true;
        this.roles = this.storageService.getUser()?.roles ?? [];
        this.toastr.success('Connexion réussie');

        this.preloadStoresAndNavigate();
      });
  }

 private preloadStoresAndNavigate(): void {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const dateDebut = this.formatDate(firstDayOfMonth);
  const dateFin = this.formatDate(today);

  forkJoin({
    tarifs: this.tarifVenteStore.load().pipe(catchError(() => of([]))),
    reglesTarif: this.tarifVenteStore.loadReglesAll().pipe(catchError(() => of([]))),

    categories: this.categorieStore.loadIfNeeded().pipe(catchError(() => of([]))),
    stocks: this.stockStore.loadIfNeeded().pipe(catchError(() => of([]))),
    produits: this.produitStore.loadIfNeeded().pipe(catchError(() => of([]))),
    fournisseurs: this.fournisseurStore.loadIfNeeded().pipe(catchError(() => of([]))),
    depots: this.depotStore.loadIfNeeded().pipe(catchError(() => of([]))),
    commandes: this.commandeAchatStore.loadIfNeeded().pipe(catchError(() => of([]))),
    commandeDash: this.commandeAchatStore.dashboard$.pipe(catchError(() => of(null))),
    receptions: this.receptionAchatStore.loadIfNeeded().pipe(catchError(() => of([]))),
    mvnts: this.mvntStore.loadIfNeeded().pipe(catchError(() => of([]))),
  }).subscribe({
    next: () => {
      this.route.navigateByUrl('/admin/pos');
    },
    error: () => {
      this.toastr.warning('Connexion réussie, mais certains chargements ont échoué.');
    //  this.route.navigateByUrl('/admin/pos');
    }
  });
}
  reloadPage(): void {
    window.location.reload();
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
