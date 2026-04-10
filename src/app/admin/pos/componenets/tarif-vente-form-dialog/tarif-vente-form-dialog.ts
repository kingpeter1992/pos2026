import { Component, Inject, OnInit } from '@angular/core';
import { Validators, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { TarifVenteStore } from '../../service/tarif/TarifVenteStore';
import { Toast } from '../../../../shares/services/toast/toast';

export interface formModel {
  mode: 'create' | 'edit';
  tarif?: any;
}

@Component({
  selector: 'app-tarif-vente-form-dialog',
  templateUrl: './tarif-vente-form-dialog.html',
  styleUrl: './tarif-vente-form-dialog.css',
  standalone:false
})
export class TarifVenteFormDialog implements OnInit {
  saving = false;
  form!: FormGroup;
  isEditMode = false;

  constructor(
    private fb: FormBuilder,
    private tarifStore: TarifVenteStore,
    private dialogRef: MatDialogRef<TarifVenteFormDialog>,
    @Inject(MAT_DIALOG_DATA) public data: formModel,
    private toast: Toast

  ) {}

  ngOnInit(): void {
    this.isEditMode = this.data?.mode === 'edit';
    this.form = this.buildForm();

    if (this.isEditMode && this.data?.tarif) {
      this.patchForm(this.data.tarif);
    }
  }

  private buildForm(): FormGroup {
    return this.fb.group({
      code: ['', [Validators.required]],
      nom: ['', [Validators.required]],
      description: [''],
      actif: [true],
      parDefaut: [false]
    });
  }

  private patchForm(tarif: any): void {
    if (!this.form) return;

    this.form.patchValue({
      code: tarif?.code ?? '',
      nom: tarif?.nom ?? '',
      description: tarif?.description ?? '',
      actif: tarif?.actif ?? true,
      parDefaut: tarif?.parDefaut ?? false
    });
  }

   submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.saving) return;

    this.saving = true;

    const payload = {
      code: this.form.get('code')?.value,
      nom: this.form.get('nom')?.value,
      description: this.form.get('description')?.value,
      actif: this.form.get('actif')?.value,
      parDefaut: this.form.get('parDefaut')?.value
    };

    const request$ = this.isEditMode
      ? this.tarifStore.update(this.data.tarif.id, payload)
      : this.tarifStore.create(payload);

    request$
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {

          this.dialogRef.close(true);
        },
        error: (err) => {
          const message =
            err?.error?.message ||
            err?.message ||
            "Erreur lors de l'enregistrement du tarif de vente.";
          this.toast.error(message);
        }
      });
  }  close(): void {
    this.dialogRef.close();
  }
}
