import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FournisseurResponse } from '../../../produits/models/fournisseur.model';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { FournisseurService } from '../../../produits/service/fouisseur-service/fournisseur-service';

@Component({
  selector: 'app-fournisseur-detail-dialog-component',
  templateUrl: './fournisseur-detail-dialog-component.html',
  styleUrl: './fournisseur-detail-dialog-component.css',
  standalone: false,

})
export class FournisseurDetailDialogComponent {

  form!: FormGroup;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private fournisseurService: FournisseurService,
    private dialogRef: MatDialogRef<FournisseurDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {

    this.isEditMode = !!this.data;

    this.form = this.fb.group({
      nom: [this.data?.nom || '', Validators.required],
      telephone: [this.data?.telephone || ''],
      email: [this.data?.email || ''],
      adresse: [this.data?.adresse || '']
    });
  }

  save(): void {

    if (this.form.invalid) return;

    if (this.isEditMode) {
      // ✅ UPDATE
      this.fournisseurService.update(this.data.id, this.form.value)
        .subscribe(() => this.dialogRef.close(true));

    } else {
      // ✅ CREATE
      this.fournisseurService.create(this.form.value)
        .subscribe(() => this.dialogRef.close(true));
    }
  }

  close(): void {
    this.dialogRef.close();
  }

}
