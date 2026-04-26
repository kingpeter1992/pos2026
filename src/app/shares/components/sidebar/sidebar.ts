import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../../../auth/services/storage/storage-service';


@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  standalone: false
})
export class Sidebar implements OnInit {

  private roles: string[] = [];
  isLoggedIn = false;
  showAdminBoard = false;
  showuserBoard = false;
  showfinanceBoard = false;
  showRhBoard = false;
  username?: string;
  isSidebarOpen = true;
  public items: any[] = [];
  public items2: any[] = [];
  public items3: any[] = [];
  public items4: any[] = [];
  public items5: any[] = [];
  public items6: any[] = [];
  public items7: any[] = [];





  // State pour les menus ouverts
  openMenus: { [key: string]: boolean } = {};

  constructor(private route: Router, private storageService: StorageService) { }

  ngOnInit(): void {
    this.isLoggedIn = this.storageService.isLoggedIn();
    if (this.isLoggedIn) {
      const user = this.storageService.getUser();
      this.roles = user.roles;
      this.showAdminBoard = this.roles.includes('ROLE_ADMIN');
      this.showuserBoard = this.roles.includes('ROLE_USER');
      this.showfinanceBoard = this.roles.includes('ROLE_CAISSIER');
      this.showRhBoard = this.roles.includes('ROLE_RESPONSABLE_PERSONNEL');
      this.username = user.username;
    }
    this.buildMenu();
    this.buildMenu2();
    this.buildMenu3();
    this.buildMenu4()
    this.buildMenu5();
     this.buildMenu6(); // ✅ important
      this.buildMenu7();

  }

  buildMenu(): void {
    this.items = this.menuPropertisGestion.map(menu => ({
      label: menu.titre,
      icon: menu.icon,
      items: menu.sousMenus?.map(sub => ({
        label: sub.titre,
        icon: sub.icon,
        routerLink: sub.url,      // <-- utilisation de routerLink
        routerLinkActiveOptions: { exact: true }
      })) || [],
    }));
  }

  buildMenu2(): void {
    this.items2 = this.menuPropertisGestionNegoce.map(menu => ({
      label: menu.titre,
      icon: menu.icon,
      items: menu.sousMenus?.map(sub => ({
        label: sub.titre,
        icon: sub.icon,
        routerLink: sub.url,      // <-- utilisation de routerLink
        routerLinkActiveOptions: { exact: true }
      })) || [],
    }));
  }

  buildMenu3(): void {
    this.items3 = this.menuPropertisGestionCaisse.map(menu => ({
      label: menu.titre,
      icon: menu.icon,
      items: menu.sousMenus?.map(sub => ({
        label: sub.titre,
        icon: sub.icon,
        routerLink: sub.url,      // <-- utilisation de routerLink
        routerLinkActiveOptions: { exact: true }
      })) || [],
    }));
  }
buildMenu4(): void {
  this.items4 = this.menuPropertisGestionAchats.map(menu => ({
    label: menu.titre,
    icon: menu.icon,
    items: menu.sousMenus?.map(sub => ({
      label: sub.titre,
      icon: sub.icon,
      routerLink: [sub.url],
      routerLinkActiveOptions: { exact: true }
    })) || []
  }));
}

  buildMenu5(): void {
    this.items5 = this.menuPropertisGestionAdmin.map(menu => ({
      label: menu.titre,
      icon: menu.icon,
      items: menu.sousMenus?.map(sub => ({
        label: sub.titre,
        icon: sub.icon,
        routerLink: sub.url,      // <-- utilisation de routerLink
        routerLinkActiveOptions: { exact: true }
      })) || [],
    }));
  }



    buildMenu6(): void {
    this.items6 = this.menuPropertisGestionStock.map(menu => ({
      label: menu.titre,
      icon: menu.icon,
      items: menu.sousMenus?.map(sub => ({
        label: sub.titre,
        icon: sub.icon,
        routerLink: sub.url,      // <-- utilisation de routerLink
        routerLinkActiveOptions: { exact: true }
      })) || [],
    }));
  }


    buildMenu7(): void {
    this.items7 = this.menuPropertisGestionInventaire.map(menu => ({
      label: menu.titre,
      icon: menu.icon,
      items: menu.sousMenus?.map(sub => ({
        label: sub.titre,
        icon: sub.icon,
        routerLink: sub.url,      // <-- utilisation de routerLink
        routerLinkActiveOptions: { exact: true }
      })) || [],
    }));
  }




public menuPropertisGestion: Array<Menu> = [
  {
    id: '1',
    icon: 'pi pi-shopping-cart',
    titre: 'POS (Caisse)',
    url: '/admin/pos',
    sousMenus: [
      { id: '1-1', titre: 'Tableau de bord POS', icon: 'pi pi-chart-line', url: '/admin/pos/dashboard' },
      { id: '1-2', titre: 'Nouvelle vente', icon: 'pi pi-shopping-bag', url: '/admin/pos/vente' },
      { id: '1-3', titre: 'Historique des ventes', icon: 'pi pi-history', url: '/admin/pos/historique-ventes' },
      { id: '1-4', titre: 'Avoir vente', icon: 'pi pi-refresh', url: '/admin/pos/retours' },
//      { id: '1-5', titre: 'Tickets', icon: 'pi pi-print', url: '/admin/pos/tickets' },
      { id: '1-6', titre: 'Rapports de ventes', icon: 'pi pi-chart-bar', url: '/admin/pos/rapports' },
      //TarifVenteComponent
      { id: '1-7', titre: 'Tarifs de vente', icon: 'pi pi-tags', url: '/admin/pos/tarifs' },
      { id: '1-8', titre: 'Règles tarifaires', icon: 'pi pi-list', url: '/admin/pos/tarif-regles' }

     ]
  }
];

public menuPropertisGestionNegoce: Array<Menu> = [
  {
    id: '2',
    icon: 'pi pi-box',
    titre: 'Produits',
    url: '/admin/produits',
    sousMenus: [
      { id: '2-1', titre: 'Liste des produits', icon: 'pi pi-list', url: '/admin/produits/liste' },
      { id: '2-2', titre: 'Créer un produit', icon: 'pi pi-plus-circle', url: '/admin/produits/create' },
      { id: '2-3', titre: 'Catégories', icon: 'pi pi-tags', url: '/admin/categories' },
      { id: '2-4', titre: 'Images produits', icon: 'pi pi-images', url: '/admin/produits/images' },
      { id: '2-5', titre: 'Scan code-barres', icon: 'pi pi-qrcode', url: '/admin/produits/scan-barcode' },
   //   { id: '2-6', titre: 'Recherche produit', icon: 'pi pi-search', url: '/admin/produits/recherche' }
    ]
  }
];

public menuPropertisGestionCaisse: Array<Menu> = [
  {
    id: '3',
    icon: 'pi pi-truck',
    titre: 'Fournisseurs',
    url: '/admin/fournisseurs',
    sousMenus: [
  //   { id: '3-2', titre: 'Liste des fournisseurs', icon: 'pi pi-list', url: '/admin/fournisseurs/liste' },
      { id: '3-3', titre: 'Ajouter fournisseur', icon: 'pi pi-user-plus', url: '/admin/fournisseurs/create' },
  //    { id: '3-4', titre: 'Produits fournisseurs', icon: 'pi pi-box', url: '/admin/fournisseurs/produits' }
    ]
  }
];

public menuPropertisGestionAchats: Array<Menu> = [
  {
    id: '4',
    icon: 'pi pi-shopping-bag',
    titre: 'Gestion Achats',
    url: '/admin/achats',
    sousMenus: [
      { id: '4-1', titre: 'Tableau de bord achats', icon: 'pi pi-chart-line', url: '/admin/achats/dashboard' },
      { id: '4-2', titre: 'Commandes fournisseurs', icon: 'pi pi-file', url: '/admin/achats/commandes' },
      { id: '4-3', titre: 'Réceptions', icon: 'pi pi-download', url: '/admin/achats/receptionslist' },
      { id: '4-5', titre: 'Suggestions de réapprovisionnement', icon: 'pi pi-lightbulb', url: '/admin/achats/suggestions' },
  //    { id: '4-6', titre: 'Analyse achats', icon: 'pi pi-chart-bar', url: '/admin/achats/analyse' },
      { id: '4-7', titre: 'Prévisions achats', icon: 'pi pi-calendar', url: '/admin/achats/previsions' }
    ]
  }
];


public menuPropertisGestionInventaire: Array<Menu> = [
  {
    id: '5',
    icon: 'pi pi-shopping-bag',
    titre: 'Gestion Inventaire',
    url: '/admin/inventaire',
    sousMenus: [
      { id: '5-1', titre: 'Tableau de bord inventaire', icon: 'pi pi-chart-line', url: '/admin/inventaire/dashboard' },
      { id: '5-2', titre: 'Inventaires', icon: 'pi pi-file', url: '/admin/inventaire/inventaires' },
      { id: '5-3', titre: 'Détails inventaire', icon: 'pi pi-info-circle', url: '/admin/inventaire/details' },
      { id: '5-5', titre: 'Bordereaux de comptage', icon: 'pi pi-list', url: '/admin/inventaire/bordereaux' },
      { id: '5-6', titre: 'Variances inventaire', icon: 'pi pi-exclamation-triangle', url: '/admin/inventaire/variances' }
    ]
  }
];

public menuPropertisGestionStock: Array<Menu> = [
  {
    id: '6',
    icon: 'pi pi-database',
    titre: 'Gestion Stock',
    url: '/admin/stock',
    sousMenus: [
      { id: '5-1', titre: 'Stock actuel', icon: 'pi pi-inbox', url: '/admin/stock/actuel' },
      { id: '5-2', titre: 'Mouvements de stock', icon: 'pi pi-sort-alt', url: '/admin/stock/mouvements' },
      { id: '5-3', titre: 'Alertes stock', icon: 'pi pi-bell', url: '/admin/stock/alertes' },
  //    { id: '5-4', titre: 'Produits en rupture', icon: 'pi pi-exclamation-triangle', url: '/admin/stock/ruptures' },
   //   { id: '5-5', titre: 'Stock faible', icon: 'pi pi-filter', url: '/admin/stock/faible' },
  //    { id: '5-6', titre: 'Inventaire', icon: 'pi pi-check-square', url: '/admin/stock/inventaire' }
    ]
  }
];

public menuPropertisGestionAdmin: Array<Menu> = [
  {
    id: '6',
    icon: 'pi pi-cog',
    titre: 'Administration',
    url: '/admin/settings',
    sousMenus: [
      { id: '6-1', titre: 'Utilisateurs', icon: 'pi pi-users', url: '/admin/users' },
      { id: '6-2', titre: 'Rôles et permissions', icon: 'pi pi-shield', url: '/admin/roles' },
      { id: '6-3', titre: 'Paramètres', icon: 'pi pi-sliders-h', url: '/admin/params' }
    ]
  }
];


  navigate(url?: string): void {
    if (!url) return;
    // URL absolue pour éviter les problèmes de route relative
    console.log('url', url);
    this.route.navigateByUrl(url);
  }

get canViewPos(): boolean {
  return this.showAdminBoard || this.showfinanceBoard;
}

get canViewProduits(): boolean {
  return this.showAdminBoard || this.showfinanceBoard;
}

get canViewFournisseurs(): boolean {
  return this.showAdminBoard || this.showfinanceBoard;
}

get canViewAchats(): boolean {
  return this.showAdminBoard || this.showfinanceBoard;
}

get canViewStock(): boolean {
  return this.showAdminBoard || this.showfinanceBoard;
}

get canViewInventaire(): boolean {
  return this.showAdminBoard || this.showfinanceBoard;
}

get canViewAdmin(): boolean {
  return this.showAdminBoard;
}
}
