import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FournisseurService } from '../../../produits/service/fouisseur-service/fournisseur-service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { FournisseurDetailDialogComponent } from '../fournisseur-detail-dialog-component/fournisseur-detail-dialog-component';
import { FournisseurRequest, FournisseurResponse } from '../../../produits/models/fournisseur.model';
import { finalize } from 'rxjs';
export interface FournisseurDialogData {
  mode: 'create' | 'edit' | 'view';
  fournisseur: FournisseurResponse | null;
}

@Component({
  selector: 'app-add-fournisseur-component',
  templateUrl: './add-fournisseur-component.html',
  styleUrl: './add-fournisseur-component.css',
  standalone: false
})
export class AddFournisseurComponent implements OnInit, AfterViewInit {
openDetails(_t148: any) {
throw new Error('Method not implemented.');
}

 displayedColumns: string[] = [
    'id',
    'nom',
    'telephone',
    'email',
    'ville',
    'pays',
    'actif',
    'actions'
  ];

  dataSource = new MatTableDataSource<FournisseurResponse>([]);
  loading = false;
  saving = false;

  form!: FormGroup;
  selectedId: number | null = null;
  searchKeyword = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private fb: FormBuilder,
    private fournisseurService: FournisseurService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  initForm(): void {
    this.form = this.fb.group({
      nom: ['', [Validators.required, Validators.maxLength(150)]],
      telephone: [''],
      email: ['', [Validators.email]],
      adresse: [''],
      pays: [''],
      ville: [''],
      description: [''],
      actif: [true, Validators.required]
    });
  }

  loadData(): void {
    this.loading = true;
    this.fournisseurService.getAll(this.searchKeyword)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => {
          this.dataSource.data = data ?? [];
          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
          }
        },
        error: (err) => {
          console.error(err);
          alert('Erreur lors du chargement des fournisseurs');
        }
      });
  }

  onSearch(): void {
    this.loadData();
  }

  resetForm(): void {
    this.selectedId = null;
    this.form.reset({
      nom: '',
      telephone: '',
      email: '',
      adresse: '',
      pays: '',
      ville: '',
      description: '',
      actif: true
    });
  }


  // ✅ CREATION
  openCreateDialog(): void {
    const dialogRef = this.dialog.open(FournisseurDetailDialogComponent, {
      width: '600px',
      data: null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadData();
    });
  }

  // ✅ MODIFICATION
  openEditDialog(fournisseur: any): void {
    const dialogRef = this.dialog.open(FournisseurDetailDialogComponent, {
      width: '600px',
      data: fournisseur
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) this.loadData();
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: FournisseurRequest = this.form.value;
    this.saving = true;

    const request$ = this.selectedId
      ? this.fournisseurService.update(this.selectedId, payload)
      : this.fournisseurService.create(payload);

    request$
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          alert(this.selectedId
            ? 'Fournisseur modifié avec succès'
            : 'Fournisseur ajouté avec succès');
          this.resetForm();
          this.loadData();
        },
        error: (err) => {
          console.error(err);
          alert(
            err?.error?.message ||
            (this.selectedId
              ? 'Erreur lors de la modification'
              : 'Erreur lors de l’enregistrement')
          );
        }
      });
  }

  remove(item: FournisseurResponse): void {
    if (!item.id) return;

    const ok = confirm(`Supprimer le fournisseur "${item.nom}" ?`);
    if (!ok) return;

    this.fournisseurService.delete(item.id).subscribe({
      next: () => {
        alert('Fournisseur supprimé avec succès');
        this.loadData();
      },
      error: (err) => {
        console.error(err);
        alert('Erreur lors de la suppression');
      }
    });
  }

  get f() {
    return this.form.controls;
  }
}
