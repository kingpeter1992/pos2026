import { AfterViewInit, Component, computed, OnInit, signal, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TarifVenteStore } from '../../service/tarif/TarifVenteStore';
import { TarifVente } from '../../../../models/tarif-vente.model';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { finalize } from 'rxjs';
import { MatSort } from '@angular/material/sort';
import { TarifVenteFormDialog } from '../tarif-vente-form-dialog/tarif-vente-form-dialog';
import { FormBuilder } from '@angular/forms';
import { Toast } from '../../../../shares/services/toast/toast';
export interface formModel {
  mode: 'create' | 'edit';
  tarif: TarifVente | null;
}
@Component({
  selector: 'app-tarif-vente-component',
  templateUrl: './tarif-vente-component.html',
  styleUrl: './tarif-vente-component.css',
  standalone:false
})
export class TarifVenteComponent implements OnInit, AfterViewInit {
  form!: ReturnType<FormBuilder['nonNullable']['group']>;
displayedColumns: string[] = [
  'code',
  'nom',
  'description',
  'statut',
  'parDefaut',
  'dateCreation',
  'actions'
];

  readonly search = signal('');
  readonly localLoading = signal(false);

  readonly totalTarifs = computed(() => this.tarifStore.total());
  readonly totalActifs = computed(() => this.tarifStore.actifs().length);
  readonly totalInactifs = computed(() => this.tarifStore.inactifs().length);
  readonly tarifParDefaut = computed(() => this.tarifStore.tarifParDefaut());

  dataSource = new MatTableDataSource<TarifVente>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    public tarifStore: TarifVenteStore,
    private dialog: MatDialog,
    private toast:Toast,
  ) {}

  ngOnInit(): void {
    this.configureFilter();
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  configureFilter(): void {
    this.dataSource.filterPredicate = (data: TarifVente, filter: string) => {
      const value = (filter || '').trim().toLowerCase();

      return [
        data.code,
        data.nom,
        data.description,
        data.actif ? 'actif' : 'inactif',
        data.parDefaut ? 'defaut' : 'non'
      ]
        .filter(Boolean)
        .some(field => String(field).toLowerCase().includes(value));
    };
  }

  loadData(force = false): void {
    this.localLoading.set(true);

    this.tarifStore.load(force)
      .pipe(finalize(() => this.localLoading.set(false)))
      .subscribe({
        next: (items) => {
          this.dataSource.data = [...items];
          this.applyCurrentFilter();
        },
        error: (err) => {
          console.error('Erreur chargement tarifs', err);
        }
      });
  }

  refreshData(): void {
    this.loadData(true);
  }

  applyFilter(event: Event): void {
    const value = (event.target as HTMLInputElement)?.value ?? '';
    this.search.set(value);
    this.dataSource.filter = value.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  applyCurrentFilter(): void {
    this.dataSource.filter = this.search().trim().toLowerCase();
  }

  openCreateDialog(): void {
    const data: formModel = {
      mode: 'create',
      tarif: null
    };

    const ref = this.dialog.open(TarifVenteFormDialog, {
      width: '720px',
      maxWidth: '95vw',
      disableClose: true,
      data
    });

    ref.afterClosed().subscribe((saved) => {
      if (saved) {
        this.toast.success('Tarif de vente créé avec succès');
        this.refreshData();
      }
    });
  }

  openEditDialog(tarif: TarifVente): void {
    const data: formModel = {
      mode: 'edit',
      tarif
    };

    const ref = this.dialog.open(TarifVenteFormDialog, {
      width: '720px',
      maxWidth: '95vw',
      disableClose: true,
      data
    });

    ref.afterClosed().subscribe((saved) => {
      if (saved) {
        this.toast.success('Tarif de vente mis à jour avec succès');
        this.refreshData();
      }
    });
  }

  toggleActif(tarif: TarifVente): void {
    if (!tarif.id) return;
    this.tarifStore.toggleActif(tarif.id).subscribe({
      next: () => this.refreshData(),

      error: (err) => console.error('Erreur activation / désactivation', err)
    });
  }

  definirParDefaut(tarif: TarifVente): void {
    if (!tarif.id || tarif.parDefaut) return;

    this.tarifStore.setParDefaut(tarif.id).subscribe({
      next: () => this.refreshData(),
      error: (err) => console.error('Erreur définition tarif par défaut', err)
    });
  }

  supprimer(tarif: TarifVente): void {
    if (!tarif.id) return;

    const confirmed = window.confirm(`Voulez-vous vraiment supprimer le tarif "${tarif.nom}" ?`);
    if (!confirmed) return;

    this.tarifStore.delete(tarif.id).subscribe({
      next: () => this.refreshData(),
      error: (err) => console.error('Erreur suppression tarif', err)
    });
  }

  trackById(index: number, item: TarifVente): number {
    return Number(item.id ?? index);
  }

}
