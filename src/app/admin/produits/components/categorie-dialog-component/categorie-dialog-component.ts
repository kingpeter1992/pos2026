import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CategorieRequest, CategorieResponse } from '../../models/categorie.model';

export interface CategorieDialogData {
  mode: 'create' | 'edit';
  categorie: CategorieResponse | null;
}


@Component({
  selector: 'app-categorie-dialog-component',
  templateUrl: './categorie-dialog-component.html',
  styleUrl: './categorie-dialog-component.css',
  standalone: false
})

export class CategorieDialogComponent implements OnInit {
  form!: FormGroup;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CategorieDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CategorieDialogData
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nom: [this.data.categorie?.nom || '', [Validators.required, Validators.maxLength(120)]],
      description: [this.data.categorie?.description || '', [Validators.maxLength(500)]],
        actif: [this.data.categorie?.actif ?? true] // ✅ nouveau

    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;

    const payload: CategorieRequest = {
      nom: this.form.value.nom?.trim(),
      description: this.form.value.description?.trim(),
      actif : this.form.value.actif // ✅ nouveau
    };

    this.dialogRef.close(payload);
  }

  close(): void {
    this.dialogRef.close();
  }

  get isEdit(): boolean {
    return this.data.mode === 'edit';
  }

  get title(): string {
    return this.isEdit ? 'Modifier la catégorie' : 'Nouvelle catégorie';
  }

  get actionLabel(): string {
    return this.isEdit ? 'Enregistrer les modifications' : 'Créer la catégorie';
  }

  get f() {
    return this.form.controls;
  }
}
