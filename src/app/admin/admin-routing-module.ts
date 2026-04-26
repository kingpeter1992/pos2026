import { computed, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayout } from './layout-component/admin-layout/admin-layout';
import { Dashboard } from './layout-component/dashboard/dashboard';
import { NouvelleVenteComponent } from './pos/componenets/nouvelle-vente.component/nouvelle-vente.component';
import { HistoriqueVentesComponent } from './pos/componenets/historique-ventes.component/historique-ventes.component';
import { RapportsVentesComponent } from './pos/componenets/rapports-ventes.component/rapports-ventes.component';
import { RetoursProduitsComponent } from './pos/componenets/retours-produits.component/retours-produits.component';
import { TicketsComponent } from './pos/componenets/tickets.component/tickets.component';
import { AdminUsersComponent } from '../user/admin-users/admin-users.component';
import { ListeProduitsComponent } from './produits/components/liste-produits-component/liste-produits-component';
import { ParamsComponent } from '../user/params-component/params-component';
import { RolesComponent } from '../user/roles-component/roles-component';
import { AchatsDashboardComponent } from './achats/components/achats-dashboard-component/achats-dashboard-component';
import { SuggestionsReapprovisionnementComponent } from './achats/components/suggestions-reapprovisionnement-component/suggestions-reapprovisionnement-component';
import { AddFournisseurComponent } from './fournisseurs/components/add-fournisseur-component/add-fournisseur-component';
import { ListeFournisseursComponent } from './fournisseurs/components/liste-fournisseurs-component/liste-fournisseurs-component';
import { ProduitsFournisseursComponent } from './fournisseurs/components/produits-fournisseurs-component/produits-fournisseurs-component';
import { CategoriesComponent } from './produits/components/categories-component/categories-component';
import { CreateProduitComponent } from './produits/components/create-produit-component/create-produit-component';
import { ImagesProduitsComponent } from './produits/components/images-produits-component/images-produits-component';
import { RechercheProduitComponent } from './produits/components/recherche-produit-component/recherche-produit-component';
import { ScanBarcodeComponent } from './produits/components/scan-barcode-component/scan-barcode-component';
import { AlertesStockComponent } from './stock/components/alertes-stock-component/alertes-stock-component';
import { MouvementsStockComponent } from './stock/components/mouvements-stock-component/mouvements-stock-component';
import { ProduitsRuptureComponent } from './stock/components/produits-rupture-component/produits-rupture-component';
import { StockActuelComponent } from './stock/components/stock-actuel-component/stock-actuel-component';
import { ProduitDetailComponent } from './produits/components/produit-detail-component/produit-detail-component';
import { HistoriqueAchatsComponent } from './achats/components/historique-achats-component/historique-achats-component';
import { PrevisionsAchatsComponent } from './achats/components/previsions-achats-component/previsions-achats-component';
import { ReceptionsComponent } from './achats/components/receptions-component/receptions-component';
import { CommandeAchatList } from './achats/components/commande-achat-list/commande-achat-list';
import { TarifVenteComponent } from './pos/componenets/tarif-vente-component/tarif-vente-component';
import { TarifReglesComponent } from './pos/componenets/tarif-regles.component/tarif-regles.component';
import { LocatorAffectationComponent } from './stock/components/locator-affectation-component/locator-affectation-component';
import { InventaireComponent } from './inventenaire/components/inventaire-component/inventaire-component';
import { InventaireDetail } from './inventenaire/components/inventaire-detail/inventaire-detail';
import { InventaireBordereauDetailComponent } from './inventenaire/components/inventaire-bordereau-detail-component/inventaire-bordereau-detail-component';
import { InventaireVarianceResume } from './inventenaire/components/inventaire-variance-resume/inventaire-variance-resume';
import { InventaireVarianceListe } from './inventenaire/components/inventaire-variance-liste/inventaire-variance-liste';

const routes: Routes = [
  {
    path: '',
    component: AdminLayout,
    children: [
      { path: '', redirectTo: 'pos/dashboard', pathMatch: 'full' },

      // POS
      { path: 'pos/dashboard', component: Dashboard },
      { path: 'pos/vente', component: NouvelleVenteComponent },
      { path: 'pos/historique-ventes', component: HistoriqueVentesComponent },
      { path: 'pos/retours', component: RetoursProduitsComponent },
      { path: 'pos/tickets', component: TicketsComponent },
      { path: 'pos/rapports', component: RapportsVentesComponent },
      { path: 'pos/tarifs', component: TarifVenteComponent },
      { path: 'pos/tarif-regles', component: TarifReglesComponent },




      // Produits
      { path: 'produits/liste', component: ListeProduitsComponent },
      { path: 'produits/create', component: CreateProduitComponent },
      { path: 'categories', component: CategoriesComponent },
      { path: 'produits/images', component: ImagesProduitsComponent },
      { path: 'produits/images/:id', component: ProduitDetailComponent },
      { path: 'produits/scan-barcode', component: ScanBarcodeComponent },
      { path: 'produits/recherche', component: RechercheProduitComponent },

      // Fournisseurs
      { path: 'fournisseurs/liste', component: ListeFournisseursComponent },
      { path: 'fournisseurs/create', component: AddFournisseurComponent },
      { path: 'fournisseurs/produits', component: ProduitsFournisseursComponent },

      // Achats
      { path: 'achats/dashboard', component: AchatsDashboardComponent },
      { path: 'achats/commandes', component: CommandeAchatList },//
      { path: 'achats/receptions', component: ReceptionsComponent },
      { path: 'achats/receptionslist', component: HistoriqueAchatsComponent },
      { path: 'achats/receptions/locators/:id', component: LocatorAffectationComponent },
      //http://localhost:4200/achats/receptions/locators/2
      { path: 'achats/historique', component: HistoriqueAchatsComponent },
      { path: 'achats/suggestions', component: SuggestionsReapprovisionnementComponent },
      //  { path: 'achats/analyse', component: AnalyseAchatsComponent },
      { path: 'achats/previsions', component: PrevisionsAchatsComponent },


      // Stock
      { path: 'stock/actuel', component: StockActuelComponent },
      { path: 'stock/mouvements', component: MouvementsStockComponent },
      { path: 'stock/alertes', component: AlertesStockComponent },
      { path: 'stock/ruptures', component: ProduitsRuptureComponent },
      //   { path: 'stock/faible', component: StockFaibleComponent },
      // { path: 'stock/inventaire', component: InventaireComponent },



      // inventaire
      { path: 'inventaire/dashboard', component: InventaireComponent },
      { path: 'inventaire/inventaires', component: InventaireComponent },
      { path: 'inventaire/details/:id', component: InventaireDetail },
      { path: 'inventaire/bordereaux/:id', component: InventaireBordereauDetailComponent },
      { path: 'inventaire/:id/variances', component: InventaireVarianceResume },
      { path: 'inventaire/variances', component: InventaireVarianceListe },






      // Admin
      { path: 'users', component: AdminUsersComponent },
      { path: 'roles', component: RolesComponent },
      { path: 'params', component: ParamsComponent },

      { path: '**', redirectTo: 'pos/dashboard' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
