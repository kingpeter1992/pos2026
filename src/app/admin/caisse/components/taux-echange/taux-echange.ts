import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TauxChangeResponse } from '../../models/taux-change.model';
import { CaisseStoreService } from '../../services/CaisseServiceStore';

@Component({
  selector: 'app-taux-echange',
  templateUrl: './taux-echange.html',
  styleUrl: './taux-echange.css',
  standalone:false
})
export class TauxEchange implements OnInit {
readonly store = inject(CaisseStoreService);

  private readonly fb = inject(FormBuilder);
  private readonly snack = inject(MatSnackBar);

  tauxList: TauxChangeResponse[] = [];
  actif: TauxChangeResponse | null = null;

  editingId: number | null = null;

  displayedColumns: string[] = [
    'taux',
    'actif',
    'dateCreation',
    'dateActivation',
    'commentaire',
    'actions'
  ];

  form = this.fb.group({
    taux: [0, [Validators.required, Validators.min(1)]],
    actif: [false],
    commentaire: ['']
  });

ngOnInit(): void {
  this.store.tauxList$.subscribe(data => {
    this.tauxList = Array.isArray(data) ? data : [];
  });

  this.store.tauxActif$.subscribe(data => {
    this.actif = data;
  });

  this.store.loadTauxList(true).subscribe();
  this.store.loadTauxActif().subscribe();
  this.store.loadDernierTaux().subscribe();
}



  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const dto = {
      taux: Number(this.form.value.taux ?? 0),
      actif: Boolean(this.form.value.actif),
      commentaire: (this.form.value.commentaire ?? '').trim()
    };

    if (this.editingId) {
      this.store.updateTaux(this.editingId, dto).subscribe({
        next: () => {
          this.snack.open('Taux modifié avec succès', 'OK', { duration: 2500 });
          this.resetForm();
        },
        error: e => this.showError(e)
      });

      return;
    }

    this.store.createTaux(dto).subscribe({
      next: () => {
        this.snack.open('Taux créé avec succès', 'OK', { duration: 2500 });
        this.resetForm();
      },
      error: e => this.showError(e)
    });
  }

  edit(row: TauxChangeResponse): void {
    this.editingId = row.id;

    this.form.patchValue({
      taux: row.taux,
      actif: row.actif,
      commentaire: row.commentaire || ''
    });
  }

  activer(row: TauxChangeResponse): void {
    if (row.actif) return;

    this.store.activerTaux(row.id).subscribe({
      next: () => {
        this.snack.open('Taux activé avec succès', 'OK', { duration: 2500 });
      },
      error: e => this.showError(e)
    });
  }

  delete(row: TauxChangeResponse): void {
    if (row.actif) {
      this.snack.open('Impossible de supprimer le taux actif', 'OK', { duration: 3000 });
      return;
    }

    if (!confirm(`Supprimer le taux ${row.taux} ?`)) return;

    this.store.deleteTaux(row.id).subscribe({
      next: () => {
        this.snack.open('Taux supprimé', 'OK', { duration: 2500 });
      },
      error: e => this.showError(e)
    });
  }

  resetForm(): void {
    this.editingId = null;

    this.form.reset({
      taux: 0,
      actif: false,
      commentaire: ''
    });
  }

  private showError(e: any): void {
    this.snack.open(
      e?.error?.message || 'Erreur opération taux',
      'OK',
      { duration: 4000 }
    );
  }
}
