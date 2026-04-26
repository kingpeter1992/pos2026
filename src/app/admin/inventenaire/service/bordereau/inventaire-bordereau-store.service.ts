import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { InventaireBordereau } from './inventaire-bordereau';
import { Toast } from '../../../../shares/services/toast/toast';
import { InventaireBordereauLigneResponse, InventaireBordereauLigneUpdateRequest, InventaireGenererBordereauxRequest } from '../../model/inventaire-bordereau.models';

@Injectable({
  providedIn: 'root'
})
export class InventaireBordereauStoreService {

 private readonly service = inject(InventaireBordereau);
  private readonly toastr = inject(Toast);

  private readonly bordereauxSubject = signal<any[]>([]);
  private readonly lignesSubject = signal<InventaireBordereauLigneResponse[]>([]);
  private readonly loadingSubject = signal(false);
  private readonly submittingSubject = signal(false);

  readonly bordereaux = this.bordereauxSubject.asReadonly();
  readonly lignes = this.lignesSubject.asReadonly();
  readonly loading = this.loadingSubject.asReadonly();
  readonly submitting = this.submittingSubject.asReadonly();

  loadBordereaux(inventaireId: number): void {
    this.loadingSubject.set(true);

    this.service.getBordereaux(inventaireId)
      .pipe(finalize(() => this.loadingSubject.set(false)))
      .subscribe({
        next: (data) => this.bordereauxSubject.set(data ?? []),
        error: (err) => {
          console.error(err);
          this.toastr.error('Erreur lors du chargement des bordereaux.');
        }
      });
  }

  loadLignes(
    bordereauId: number,
    callback?: (rows: InventaireBordereauLigneResponse[]) => void
  ): void {
    this.loadingSubject.set(true);

    this.service.getLignes(bordereauId)
      .pipe(finalize(() => this.loadingSubject.set(false)))
      .subscribe({
        next: (data) => {
          const rows = data ?? [];
          this.lignesSubject.set(rows);
          callback?.(rows);
          console.log('Lignes du bordereau chargées:', rows);
        },
        error: (err) => {
          console.error(err);
          this.toastr.error('Erreur lors du chargement des lignes du bordereau.');
        }
      });
  }

  genererBordereaux(
    inventaireId: number,
    request: InventaireGenererBordereauxRequest,
    callbacks?: { next?: (rows: InventaireBordereau[]) => void; error?: (message: string) => void }
  ): void {
    this.submittingSubject.set(true);

    this.service.genererBordereaux(inventaireId, request)
      .pipe(finalize(() => this.submittingSubject.set(false)))
      .subscribe({
        next: (rows) => {
          this.bordereauxSubject.set(rows ?? []);
          this.toastr.success('Bordereaux générés avec succès.');
          callbacks?.next?.(rows ?? []);
        },
        error: (err) => {
          console.error(err);
          const message = err?.error?.message || 'Erreur lors de la génération des bordereaux.';
          this.toastr.error(message);
          callbacks?.error?.(message);
        }
      });
  }

  saveLignes(
    bordereauId: number,
    lignes: InventaireBordereauLigneUpdateRequest[],
    callbacks?: { next?: () => void; error?: (message: string) => void }
  ): void {
    this.submittingSubject.set(true);

    this.service.saveLignes(bordereauId, lignes)
      .pipe(finalize(() => this.submittingSubject.set(false)))
      .subscribe({
        next: () => {
          this.toastr.success('Comptage enregistré.');
          callbacks?.next?.();
        },
        error: (err) => {
          console.error(err);
          const message = err?.error?.message || 'Erreur lors de l’enregistrement du comptage.';
          this.toastr.error(message);
          callbacks?.error?.(message);
        }
      });
  }

  validerBordereau(
    bordereauId: number,
    user: string,
    callbacks?: { next?: () => void; error?: (message: string) => void }
  ): void {
    this.submittingSubject.set(true);

    this.service.validerBordereau(bordereauId, user)
      .pipe(finalize(() => this.submittingSubject.set(false)))
      .subscribe({
        next: () => {
          this.toastr.success('Bordereau validé.');
          callbacks?.next?.();
        },
        error: (err) => {
          console.error(err);
          const message = err?.error?.message || 'Erreur lors de la validation.';
          this.toastr.error(message);
          callbacks?.error?.(message);
        }
      });
  }

  miseAJourStock(
    bordereauId: number,
    user: string,
    callbacks?: { next?: () => void; error?: (message: string) => void }
  ): void {
    this.submittingSubject.set(true);

    this.service.miseAJourStock(bordereauId, user)
      .pipe(finalize(() => this.submittingSubject.set(false)))
      .subscribe({
        next: () => {
          this.toastr.success('Stock mis à jour.');
          callbacks?.next?.();
        },
        error: (err) => {
          console.error(err);
          const message = err?.error?.message || 'Erreur lors de la mise à jour stock.';
          this.toastr.error(message);
          callbacks?.error?.(message);
        }
      });
  }


lancerVariances(
  bordereauId: number,
  callbacks?: { next?: () => void; error?: (message: string) => void }
): void {
  this.submittingSubject.set(true);

  this.service.lancerVariances(bordereauId)
    .pipe(finalize(() => this.submittingSubject.set(false)))
    .subscribe({
      next: () => {
        this.toastr.success('Variances lancées pour ce bordereau.');
        callbacks?.next?.();
      },
      error: (err) => {
        console.error(err);
        const message = err?.error?.message || 'Erreur lors du lancement des variances.';
        this.toastr.error(message);
        callbacks?.error?.(message);
      }
    });
}



}
