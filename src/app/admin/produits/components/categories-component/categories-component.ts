import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { CategorieStoreService } from '../../core/categorie-store.service';
import { CategorieResponse, CategorieRequest } from '../../models/categorie.model';
import { CategorieService } from '../../service/categorie-service/categorie-service';
import { CategorieDialogComponent } from '../categorie-dialog-component/categorie-dialog-component';

@Component({
  selector: 'app-categories-component',
  templateUrl: './categories-component.html',
  styleUrl: './categories-component.css',
  standalone: false,
})
export class CategoriesComponent implements OnInit {
  categories: CategorieResponse[] = [];
  filteredCategories: CategorieResponse[] = [];

  loading = false;
  searchTerm = '';

  kpiTotal = 0;
  kpiActives = 0;

  constructor(
    private categorieStore: CategorieStoreService,
    private categorieService: CategorieService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.categorieStore.categories$.subscribe(data => {
      this.categories = [...data].sort((a, b) => a.nom.localeCompare(b.nom));
      this.applyFilter();
      this.computeKpis();
    });

    this.categorieStore.loading$.subscribe(loading => {
      this.loading = loading;
    });

    this.categorieStore.loadIfNeeded().subscribe();
  }

  computeKpis(): void {
    this.kpiTotal = this.categories.length;
    this.kpiActives = this.categories.filter(c => c.actif).length;
  }

  applyFilter(): void {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      this.filteredCategories = [...this.categories];
      return;
    }

    this.filteredCategories = this.categories.filter(c =>
      c.nom.toLowerCase().includes(term) ||
      (c.description || '').toLowerCase().includes(term)
    );
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CategorieDialogComponent, {
      width: '680px',
      maxWidth: '95vw',
      disableClose: true,
      data: {
        mode: 'create',
        categorie: null
      }
    });

    dialogRef.afterClosed().subscribe((result: CategorieRequest | undefined) => {
      if (!result) return;
      this.loading = true;
      this.categorieService.create(result)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: (res) => {
            this.categorieStore.addOne(res);
          },
          error: (err) => {
            console.error('Erreur création catégorie', err);
          }
        });
    });
  }

  openEditDialog(categorie: CategorieResponse): void {
    const dialogRef = this.dialog.open(CategorieDialogComponent, {
      width: '680px',
      maxWidth: '95vw',
      disableClose: true,
      data: {
        mode: 'edit',
        categorie
      }
    });

    dialogRef.afterClosed().subscribe((result: CategorieRequest | undefined) => {
      if (!result) return;

      this.loading = true;
      this.categorieService.update(categorie.id, result)
        .pipe(finalize(() => this.loading = false))
        .subscribe({
          next: (res) => {
            this.categorieStore.updateOne(res);
          },
          error: (err) => {
            console.error('Erreur modification catégorie', err);
          }
        });
    });
  }

  refresh(): void {
    this.loading = true;
    this.categorieStore.refresh()
      .pipe(finalize(() => this.loading = false))
      .subscribe();
  }

  getSeverity(actif: boolean): 'success' | 'danger' {
    return actif ? 'success' : 'danger';
  }
}
