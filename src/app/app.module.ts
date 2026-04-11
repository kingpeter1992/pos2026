import { importProvidersFrom, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';

// Third-party modules


// PrimeNG
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { CardModule, Card } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { PanelModule } from 'primeng/panel';
import { StepperModule } from 'primeng/stepper';
import { NgxEchartsModule } from 'ngx-echarts';
import { MatExpansionModule } from '@angular/material/expansion';


//Materiel design
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideNativeDateAdapter } from '@angular/material/core';

import { MatChipsModule } from '@angular/material/chips';


// Toastr
import { ToastrModule } from 'ngx-toastr';

// Routing & Shared
import { AppRoutingModule } from './app.routes';
import { SharedModuleModule } from './shares/services/shared-module/shared-module-module';

// Components
import { AppComponent } from './app.component';
import { Login } from './auth/components/login/login';
import { Register } from './auth/components/register/register';
import { AdminLayout } from './admin/layout-component/admin-layout/admin-layout';
import { Sidebar } from './shares/components/sidebar/sidebar';
import { Header } from './shares/components/header/header';
import { Footer } from './shares/components/footer/footer';

// Services
import { AuthService } from './auth/services/auth/auth-service';
import { authGuard } from './auth/services/gurad/auth-guard';
import { BadgeModule } from 'primeng/badge';
import { PanelMenuModule } from 'primeng/panelmenu';
import { RippleModule } from 'primeng/ripple';
import { ChartModule } from 'primeng/chart';
import { TreeTableModule } from 'primeng/treetable';
import { SelectModule } from 'primeng/select';
import { AuthInterceptor } from './auth/services/interceptor/auth-interceptor';
import { Loader } from './shares/loader/loader';
import { MessageService } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { Dialogconfirm } from './shares/components/dialogconfirm/dialogconfirm';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ConfirmDialogComponent } from './shares/components/confirm-dialog-component/confirm-dialog-component';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { BaseChartDirective } from 'ng2-charts';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs'; // ✅ pour mat-tab-group
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { RenitialisationpasswordComponent } from './user/renitialisationpassword/renitialisationpassword.component';
import { ProfiluserComponent } from './user/profiluser/profiluser.component';
import { AdminUsersComponent } from './user/admin-users/admin-users.component';
import { PasswordforgotComponent } from './user/passwordforgot/passwordforgot.component';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';

import { CommonModule } from '@angular/common';
import { DividerModule } from 'primeng/divider';

import { MatMenuModule } from '@angular/material/menu';
import { Dashboard } from './admin/layout-component/dashboard/dashboard';
import { CategoriesComponent } from './admin/produits/components/categories-component/categories-component';
import { CategorieDialogComponent } from './admin/produits/components/categorie-dialog-component/categorie-dialog-component';
import { CreateProduitComponent } from './admin/produits/components/create-produit-component/create-produit-component';
import { ListeProduitsComponent } from './admin/produits/components/liste-produits-component/liste-produits-component';
import { ProduitDialog } from './admin/produits/components/produit-dialog/produit-dialog';
import { ImagesProduitsComponent } from './admin/produits/components/images-produits-component/images-produits-component';
import { ProduitDetailComponent } from './admin/produits/components/produit-detail-component/produit-detail-component';
import { ScanBarcodeComponent } from './admin/produits/components/scan-barcode-component/scan-barcode-component';
import { AddFournisseurComponent } from './admin/fournisseurs/components/add-fournisseur-component/add-fournisseur-component';
import { FournisseurDetailDialogComponent } from './admin/fournisseurs/components/fournisseur-detail-dialog-component/fournisseur-detail-dialog-component';
import { CommandeAchatList } from './admin/achats/components/commande-achat-list/commande-achat-list';
import { CommandesFournisseursComponent } from './admin/achats/components/commandes-fournisseurs-component/commandes-fournisseurs-component';
import { ReceptionsComponent } from './admin/achats/components/receptions-component/receptions-component';
import { FactureFournisseur } from './admin/achats/components/facture-fournisseur/facture-fournisseur';
import { CommandeAchatDetail } from './admin/achats/components/commande-achat-detail/commande-achat-detail';
import { CreateProduitDialogComponent } from './admin/achats/components/create-produit-dialog-component/create-produit-dialog-component';
import { BarcodeScannerDialogComponent } from './admin/achats/components/barcode-scanner-dialog-component/barcode-scanner-dialog-component';
import { ProduitSelectionDialogComponent } from './admin/achats/components/produit-selection-dialog-component/produit-selection-dialog-component';
import { VoirDdetilsLignesComponents } from './admin/achats/components/voir-ddetils-lignes-components/voir-ddetils-lignes-components';
import { StockActuelComponent } from './admin/stock/components/stock-actuel-component/stock-actuel-component';
import { HistoriqueAchatsComponent } from './admin/achats/components/historique-achats-component/historique-achats-component';
import { ReceptionDetailComponent } from './admin/achats/components/reception-detail-component/reception-detail-component';
import { MouvementsStockComponent } from './admin/stock/components/mouvements-stock-component/mouvements-stock-component';
import { NouvelleVenteComponent } from './admin/pos/componenets/nouvelle-vente.component/nouvelle-vente.component';
import { ProduitPickerDialogComponent } from './admin/pos/componenets/produit-picker-dialog-component/produit-picker-dialog-component';
import { AchatsDashboardComponent } from './admin/achats/components/achats-dashboard-component/achats-dashboard-component';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { TarifVenteComponent } from './admin/pos/componenets/tarif-vente-component/tarif-vente-component';
import { TarifVenteFormDialog } from './admin/pos/componenets/tarif-vente-form-dialog/tarif-vente-form-dialog';
import { TarifRegleFormDialog } from './admin/pos/componenets/tarif-regle-form-dialog/tarif-regle-form-dialog';
import { TarifReglesComponent } from './admin/pos/componenets/tarif-regles.component/tarif-regles.component';
import { HistoriqueVentesComponent } from './admin/pos/componenets/historique-ventes.component/historique-ventes.component';
import { RetoursProduitsComponent } from './admin/pos/componenets/retours-produits.component/retours-produits.component';
import { ConfirmAnnulationVenteDialogComponent } from './admin/pos/componenets/confirm-annulation-vente-dialog-component/confirm-annulation-vente-dialog-component';
import { RapportsVentesComponent } from './admin/pos/componenets/rapports-ventes.component/rapports-ventes.component';
import { SuggestionsReapprovisionnementComponent } from './admin/achats/components/suggestions-reapprovisionnement-component/suggestions-reapprovisionnement-component';


@NgModule({
  declarations: [
    AppComponent,
    Login,
    Register,
    AdminLayout,
    Sidebar,
    Header,
    Footer,
    Loader,
    Dialogconfirm,
    ConfirmDialogComponent,
    Footer,
    RenitialisationpasswordComponent,
    ProfiluserComponent,
    AdminUsersComponent,
    PasswordforgotComponent,
    Dashboard,
    CategoriesComponent,
    CategorieDialogComponent,
    CreateProduitComponent,
    ListeProduitsComponent,
    ProduitDialog,
    ImagesProduitsComponent,
    ProduitDetailComponent,
    ScanBarcodeComponent,
    AddFournisseurComponent,
    FournisseurDetailDialogComponent,
    CommandeAchatList,
    CommandesFournisseursComponent,
    ReceptionsComponent,
    FactureFournisseur,
    CommandeAchatDetail,
    CreateProduitDialogComponent,
    BarcodeScannerDialogComponent,
    ProduitSelectionDialogComponent,
    VoirDdetilsLignesComponents,
    StockActuelComponent,
    HistoriqueAchatsComponent,
    ReceptionDetailComponent,
    MouvementsStockComponent,
    NouvelleVenteComponent,
    ProduitPickerDialogComponent,
    AchatsDashboardComponent,
    TarifVenteComponent,
    TarifVenteFormDialog,
    TarifRegleFormDialog,
    TarifReglesComponent,
    HistoriqueVentesComponent,
    RetoursProduitsComponent,
    ConfirmAnnulationVenteDialogComponent,
    RapportsVentesComponent,
    SuggestionsReapprovisionnementComponent
  ],

  imports: [

    BrowserModule,
    ConfirmDialogModule,
    TagModule,
    CardModule,
    HttpClientModule,
    MatBadgeModule,
    ProgressBarModule,
    MatProgressSpinnerModule,
    FormsModule,
    MatSlideToggleModule,
    InputTextModule,
    ReactiveFormsModule,
    AppRoutingModule,
    MatCheckboxModule,
    SharedModuleModule,
    ChartModule,
    TreeTableModule,
    PanelMenuModule,
    BadgeModule,
    MatProgressBarModule,
    PanelMenuModule,
    RippleModule,
    SelectModule,
    MatCardModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule, // ✅ ajoute ce module
    PanelMenuModule, ToastrModule,
    ToastModule,
    TableModule,
    // ✅ nécessaire pour p-table
    ButtonModule,
    DialogModule,
    MatFormFieldModule, MatInputModule, MatDatepickerModule, MatDialogModule,
    PanelModule,
    StepperModule,
    MatAutocompleteModule,
    MatIconModule,
    MatDividerModule,
    MatProgressBarModule,
    MatTableModule,
    ZXingScannerModule,
    MatChipsModule,
    MatPaginatorModule,
    MatButtonToggleModule,
    MatNativeDateModule,
    AutoCompleteModule,
    SkeletonModule,
    BaseChartDirective,
    MatTooltipModule,
    MatBadgeModule,
    MatExpansionModule,



    CommonModule,
    CardModule,
    ChartModule,
    ButtonModule,
    TagModule,
    DividerModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    MatIconModule,
    MatTooltipModule,
MatSelectModule,


    NgxEchartsModule.forRoot({
      echarts: () => import('echarts')
    }),

    // Toastr
    ToastrModule.forRoot({
      positionClass: 'toast-top-right',
      preventDuplicates: true
    }),
    Card
  ],

  providers: [
    AuthService,
    provideNativeDateAdapter(),
    authGuard,
    MessageService,
    ConfirmationService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura
      }
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }


