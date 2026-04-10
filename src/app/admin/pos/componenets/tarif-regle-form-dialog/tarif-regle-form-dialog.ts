import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { finalize, switchMap } from 'rxjs';
import { TarifVenteStore } from '../../service/tarif/TarifVenteStore';
import { Toast } from '../../../../shares/services/toast/toast';
import { CategorieStoreService } from '../../../produits/core/categorie-store.service';
import { CategorieResponse } from '../../../produits/models/categorie.model';
import { TarifVente } from '../../../../models/tarif-vente.model';
import { TarifCategorieProduitRequest } from '../../../produits/models/vente.model';

export interface FirmModel {
  tarifVenteId?: number | null;
  tarifNom?: string;
  regle?: {
    id?: number;
    categorieId?: number;
    tauxMarge?: number;
    tauxRemiseMax?: number;
    actif?: boolean;
    modeArrondi?: string;
  } | null;
}
@Component({
  selector: 'app-tarif-regle-form-dialog',
  templateUrl: './tarif-regle-form-dialog.html',
  styleUrl: './tarif-regle-form-dialog.css',
  standalone: false
})
export class TarifRegleFormDialog implements OnInit {
form!: FormGroup;
  saving = false;
  isEditMode = false;

  categories: CategorieResponse[] = [];
  tarifs: TarifVente[] = [];

  readonly modesArrondi = [
    { value: 'AUCUN', label: 'Aucun' },
    { value: 'ENTIER_SUP', label: 'Entier supérieur' },
    { value: 'MULTIPLE_10', label: 'Multiple de 10' },
    { value: 'MULTIPLE_50', label: 'Multiple de 50' },
    { value: 'MULTIPLE_100', label: 'Multiple de 100' }
  ];

  readonly modesTarif = [
    { value: 'existing', label: 'Sélectionner un tarif existant' },
    { value: 'new', label: 'Saisir un nouveau code tarif' }
  ];

  constructor(
    private fb: FormBuilder,
    private store: TarifVenteStore,
    private dialogRef: MatDialogRef<TarifRegleFormDialog>,
    @Inject(MAT_DIALOG_DATA) public data: FirmModel,
    private toast: Toast,
    private categorieStore: CategorieStoreService
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.data?.regle;
    this.form = this.buildForm();

    this.loadCategories();
    this.loadTarifs();
      if (this.isEditMode) {
        this.form.get('categorieId')?.disable();
      }

  }
private buildForm(): FormGroup {
  return this.fb.group({
    tarifVenteId: [this.data?.tarifVenteId ?? null, [Validators.required]],
    categorieId: [this.data?.regle?.categorieId ?? null, [Validators.required]],
    tauxMarge: [
      this.toNumber(this.data?.regle?.tauxMarge, 0),
      [Validators.required, Validators.min(0)]
    ],
    tauxRemiseMax: [
      this.toNumber(this.data?.regle?.tauxRemiseMax, 0),
      [Validators.required, Validators.min(0)]
    ],
    actif: [this.data?.regle?.actif ?? true],
    modeArrondi: [this.data?.regle?.modeArrondi ?? 'AUCUN', [Validators.required]]
  });
}


  private loadCategories(): void {
    this.categorieStore.loadIfNeeded().subscribe({
      next: (data: CategorieResponse[]) => {
        this.categories = Array.isArray(data) ? data : [];
      },
      error: (err) => {
        console.error('Erreur chargement catégories', err);
        this.categories = [];
        this.toast.error('Impossible de charger les catégories.');
      }
    });
  }

  private loadTarifs(): void {
    this.store.load().subscribe({
      next: (data: TarifVente[]) => {
        this.tarifs = Array.isArray(data) ? data : [];
      },
      error: (err) => {
        console.error('Erreur chargement tarifs', err);
        this.tarifs = [];
        this.toast.error('Impossible de charger les tarifs.');
      }
    });
  }

  submit(): void {
  if (this.form.invalid || this.saving) {
    this.form.markAllAsTouched();
    return;
  }

  this.saving = true;

  const raw = this.form.getRawValue();

  const tarifVenteId = this.isEditMode
    ? Number(this.data?.tarifVenteId)
    : Number(raw.tarifVenteId);

  if (!tarifVenteId || Number.isNaN(tarifVenteId)) {
    this.toast.error('Veuillez sélectionner un tarif.');
    this.saving = false;
    return;
  }

  const payload: TarifCategorieProduitRequest = {
    tarifVenteId,
    categorieId: Number(raw.categorieId),
    tauxMarge: this.toNumber(raw.tauxMarge, 0),
    tauxRemiseMax: this.toNumber(raw.tauxRemiseMax, 0),
    actif: !!raw.actif,
    modeArrondi: raw.modeArrondi || 'AUCUN'
  };

  this.store.saveRegle(payload)
    .pipe(finalize(() => (this.saving = false)))
    .subscribe({
      next: (saved) => {
        this.toast.success(
          this.isEditMode
            ? 'Règle tarifaire mise à jour avec succès.'
            : 'Règle tarifaire enregistrée avec succès.'
        );
        this.dialogRef.close(saved);
      },
      error: (err) => {
        console.error('Erreur enregistrement règle', err);
        const message =
          err?.error?.message ||
          err?.message ||
          "Erreur lors de l'enregistrement de la règle tarifaire.";
        this.toast.error(message);
      }
    });
}

  close(): void {
    if (this.saving) return;
    this.dialogRef.close();
  }

  trackByCategorieId(_: number, item: CategorieResponse): number {
    return item.id;
  }

  trackByTarifId(_: number, item: TarifVente): number {
    return item.id;
  }

  private toNumber(value: unknown, fallback = 0): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
}
