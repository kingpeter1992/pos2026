import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { ReceptionLocatorPreparationResponse, ReceptionLocatorRequest } from '../../models/reception-locator.model';
import { ReceptionLocatorServiceStore } from '../../service/locator-service/reception-locator-service-store';


@Component({
  selector: 'app-locator-affectation-component',
  templateUrl: './locator-affectation-component.html',
  styleUrl: './locator-affectation-component.css',
  standalone: false
})
export class LocatorAffectationComponent  implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly store = inject(ReceptionLocatorServiceStore);

  form!: FormGroup;
  receptionId!: number;

  readonly loading = this.store.loading;
  readonly submitting = this.store.submitting;
  readonly current = this.store.current;

  ngOnInit(): void {
    this.initForm();

    const id = Number(this.route.snapshot.paramMap.get('id'));
    console.log('Reception ID from route:', id);
    if (!id) {
      this.snackBar.open('Réception introuvable.', 'Fermer', { duration: 3000 });
      this.router.navigate(['/admin/receptions']);
      return;
    }

    this.receptionId = id;
    this.loadData();
  }

  ngOnDestroy(): void {
    this.store.clear();
  }

  initForm(): void {
    this.form = this.fb.group({
      refReception: [''],
      depotNom: [''],
      lignes: this.fb.array([])
    });
  }

  get lignesFormArray(): FormArray {
    return this.form.get('lignes') as FormArray;
  }

  createLigneForm(ligne: any): FormGroup {
    return this.fb.group({
      produitId: [ligne.produitId, Validators.required],
      produitNom: [ligne.produitNom],
      quantiteRecue: [Number(ligne.quantiteRecue || 0)],
      locatorCode: [ligne.locatorCode || '', Validators.required],
      quantiteRangee: [Number(ligne.quantiteRecue || 0), [Validators.required, Validators.min(0.001)]]
    });
  }

  patchForm(data: ReceptionLocatorPreparationResponse): void {
    this.form.patchValue({
      refReception: data.refReception,
      depotNom: data.depotNom
    });

    this.lignesFormArray.clear();

    (data.lignes || []).forEach(ligne => {
      this.lignesFormArray.push(this.createLigneForm(ligne));
    });
  }

  loadData(): void {
    this.store.loadIfNeeded(this.receptionId).subscribe({
      next: (res) => {
        this.patchForm(res);
        console.log('Data loaded for locator affectation:', res);
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Erreur lors du chargement des locators.', 'Fermer', {
          duration: 3500
        });
      }
    });
  }

  refresh(): void {
    this.store.refresh(this.receptionId).subscribe({
      next: (res) => {
        this.patchForm(res);
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Erreur lors de l’actualisation.', 'Fermer', {
          duration: 3500
        });
      }
    });
  }

  normalizeLocator(index: number): void {
    const ctrl = this.lignesFormArray.at(index).get('locatorCode');
    const value = (ctrl?.value || '').toString().trim().toUpperCase();
    ctrl?.setValue(value, { emitEvent: false });
  }

  buildPayload(): ReceptionLocatorRequest {
    return {
      lignes: this.lignesFormArray.controls.map(ctrl => ({
        produitId: Number(ctrl.get('produitId')?.value),
        locatorCode: (ctrl.get('locatorCode')?.value || '').toString().trim().toUpperCase(),
        quantiteRangee: Number(ctrl.get('quantiteRangee')?.value || 0)
      }))
    };
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('Veuillez compléter les locators obligatoires.', 'Fermer', {
        duration: 3000
      });
      return;
    }

    const payload = this.buildPayload();

    this.store.save(this.receptionId, payload).subscribe({
      next: () => {
        this.snackBar.open('Locators enregistrés avec succès.', 'Fermer', {
          duration: 3000
        });
        this.router.navigate(['/admin/receptions/details', this.receptionId]);
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open(
          err?.error?.message || 'Erreur lors de l’enregistrement des locators.',
          'Fermer',
          { duration: 4000 }
        );
      }
    });
  }

 cancel(): void {
  this.router.navigate(['/admin/receptions/details', this.receptionId]);
}
}
