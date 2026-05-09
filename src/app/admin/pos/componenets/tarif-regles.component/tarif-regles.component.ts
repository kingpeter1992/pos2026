import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { TarifCategorieProduitResponse } from '../../../produits/models/vente.model';
import { TarifVenteStore } from '../../service/tarif/TarifVenteStore';
import { TarifRegleFormDialog } from '../tarif-regle-form-dialog/tarif-regle-form-dialog';
import { StorageService } from '../../../../auth/services/storage/storage-service';

@Component({
  selector: 'app-tarif-regles.component',
  templateUrl: './tarif-regles.component.html',
  styleUrl: './tarif-regles.component.css',
  standalone: false

})export class TarifReglesComponent implements OnInit {
  @Input() tarifVenteId!: number;
  @Input() tarifNom = '';
  @Input() categories: Array<{ id: number; nom: string }> = [];

  loading = false;

    private roles: string[] = [];
  showAdminBoard = false;
 isLoggedIn = false;

  displayedColumns = [
    'categorieNom',
    'tauxMarge',
    'tauxRemiseMax',
    'modeArrondi',
    'actif',
    'actions'
  ];

  constructor(
    public store: TarifVenteStore,
    private dialog: MatDialog,
        private storageService: StorageService

  ) {}

  ngOnInit(): void {
    this.loadAll();


    this.isLoggedIn = this.storageService.isLoggedIn();
    if (this.isLoggedIn) {
      const user = this.storageService.getUser();
      this.roles = user.roles;
      this.showAdminBoard = this.roles.includes('ROLE_ADMIN');
  }
  }

  loadAll(): void {
    this.loading = true;
    this.store.loadReglesAll()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (data) => {
          console.log('Toutes les règles chargées :', data);
          console.log('store.regles() = ', this.store.regles());
        },
        error: (err) => {
          console.error('Erreur chargement des règles', err);
        }
      });
  }

  loadByTarif(): void {
    const id = Number(this.tarifVenteId);
    if (!id || id <= 0) return;

    this.loading = true;
    this.store.loadReglesByTarif(id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (data) => {
          console.log('Règles du tarif chargées :', data);
        },
        error: (err) => {
          console.error('Erreur chargement règles par tarif', err);
        }
      });
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(TarifRegleFormDialog, {
      width: '720px',
      maxWidth: '95vw',
      disableClose: true,
      data: {
        tarifVenteId: this.tarifVenteId,
        tarifNom: this.tarifNom,
        categories: this.categories,
        regle: null
      }
    });

    ref.afterClosed().subscribe(saved => {
      if (saved) {
        this.loadAll();
      }
    });
  }

  openEditDialog(regle: TarifCategorieProduitResponse): void {
    const ref = this.dialog.open(TarifRegleFormDialog, {
      width: '720px',
      maxWidth: '95vw',
      disableClose: true,
      data: {
        tarifVenteId: regle.tarifVenteId ?? this.tarifVenteId,
        tarifNom: regle.tarifNom ?? this.tarifNom,
        categories: this.categories,
        regle
      }
    });

    ref.afterClosed().subscribe(saved => {
      if (saved) {
        this.loadAll();
      }
    });
  }
}
