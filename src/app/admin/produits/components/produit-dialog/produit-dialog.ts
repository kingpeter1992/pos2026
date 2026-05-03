import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CategorieStoreService } from '../../core/categorie-store.service';
import { CategorieResponse } from '../../models/categorie.model';
import { ImagePhotoRequest, ImagePhotoResponse, ProduitRequest, ProduitResponse } from '../../models/produit.model';
export interface ProduitDialogData {
  mode: 'create' | 'edit';
  produit: ProduitResponse | null;
}

@Component({
  selector: 'app-produit-dialog',
  templateUrl: './produit-dialog.html',
  styleUrl: './produit-dialog.css',
  standalone: false,
})
export class ProduitDialog implements OnInit {
  form!: FormGroup;
  categories: CategorieResponse[] = [];
  previews: string[] = [];
  selectedImages: ImagePhotoRequest[] = [];
  existingImages: ImagePhotoResponse[] = [];
  submitting = false;
  produit: any;

  constructor(
    private fb: FormBuilder,
    private categorieStore: CategorieStoreService,
    private dialogRef: MatDialogRef<ProduitDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ProduitDialogData
  ) {}

  ngOnInit(): void {
    this.categorieStore.categories$.subscribe(data => {
      this.categories = data;
    });

    this.categorieStore.loadIfNeeded().subscribe();

    this.form = this.fb.group({
      codeBarres: [this.data.produit?.codeBarres || ''],
      nom: [this.data.produit?.nom || '', [Validators.required, Validators.maxLength(150)]],
      description: [this.data.produit?.description || ''],
      categorieId: [this.data.produit?.categorieId ?? null],
      prixVente: [this.data.produit?.prixVente ?? 0, [Validators.required, Validators.min(0)]],
      stockMinimum: [this.data.produit?.stockMinimum ?? 0, [Validators.required, Validators.min(0)]],
      stockMaximum: [this.data.produit?.stockMaximum ?? 0, [Validators.required, Validators.min(0)]],
      perissable: [this.data.produit?.perissable || 'NON', Validators.required],
      actif: [this.data.produit?.actif ?? true]
    });

    if (this.data.produit?.images?.length) {
      this.existingImages = [...this.data.produit.images];
    }
  }

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        this.previews.push(base64);
        this.selectedImages.push({
          nomFichier: file.name,
          contentType: file.type,
          url: base64,
          principale: this.totalImagesCount() === 0 && index === 0
        });
      };
      reader.readAsDataURL(file);
    });
  }

  totalImagesCount(): number {
    return this.existingImages.length + this.selectedImages.length;
  }

  setExistingAsMain(index: number): void {
    this.existingImages = this.existingImages.map((img, i) => ({
      ...img,
      principale: i === index
    }));

    this.selectedImages = this.selectedImages.map(img => ({
      ...img,
      principale: false
    }));
  }

  setNewAsMain(index: number): void {
    this.existingImages = this.existingImages.map(img => ({
      ...img,
      principale: false
    }));

    this.selectedImages = this.selectedImages.map((img, i) => ({
      ...img,
      principale: i === index
    }));
  }

  removeExistingImage(index: number): void {
    const removedWasMain = this.existingImages[index]?.principale;
    this.existingImages.splice(index, 1);

    if (removedWasMain) {
      if (this.existingImages.length > 0) {
        this.existingImages[0].principale = true;
      } else if (this.selectedImages.length > 0) {
        this.selectedImages[0].principale = true;
      }
    }
  }

  removeNewImage(index: number): void {
    const removedWasMain = this.selectedImages[index]?.principale;
    this.selectedImages.splice(index, 1);
    this.previews.splice(index, 1);

    if (removedWasMain) {
      if (this.existingImages.length > 0) {
        this.existingImages[0].principale = true;
      } else if (this.selectedImages.length > 0) {
        this.selectedImages[0].principale = true;
      }
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;

    const images: ImagePhotoRequest[] = [
      ...this.existingImages.map(img => ({
        nomFichier: img.nomFichier,
        contentType: img.contentType,
        url: img.url,
        principale: img.principale
      })),
      ...this.selectedImages
    ];

    const payload: ProduitRequest = {
      codeBarres: this.form.value.codeBarres?.trim() || undefined,
      nom: this.form.value.nom?.trim(),
      description: this.form.value.description?.trim(),
      categorieId: this.form.value.categorieId,
      prixVente: this.form.value.prixVente,
      stockMinimum: this.form.value.stockMinimum,
      stockMaximum: this.form.value.stockMaximum,
      perissable: this.form.value.perissable,
      actif: this.form.value.actif,
      images
    } as ProduitRequest & { actif?: boolean };

    this.dialogRef.close(payload);
  }

  close(): void {
    this.dialogRef.close();
  }

  get isEdit(): boolean {
    return this.data.mode === 'edit';
  }

  get title(): string {
    return this.isEdit ? 'Modifier le produit' : 'Nouveau produit';
  }

  get actionLabel(): string {
    return this.isEdit ? 'Enregistrer les modifications' : 'Créer le produit';
  }

  get f() {
    return this.form.controls;
  }
}
