import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { InventaireVarianceService, InventaireVarianceResumeResponse } from '../../service/variance/inventaire-variance-service';

@Component({
  selector: 'app-inventaire-variance-resume',
  templateUrl: './inventaire-variance-resume.html',
  styleUrl: './inventaire-variance-resume.css',
  standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush


})
export class InventaireVarianceResume implements OnInit {
  private route = inject(ActivatedRoute);
  private varianceService = inject(InventaireVarianceService);

  inventaireId = 0;

  loading = signal(false);
  loadingPdf = signal(false);
  lancementEnCours = signal(false);

  resume = signal<InventaireVarianceResumeResponse | null>(null);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.inventaireId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.inventaireId) {
      this.loadResume();
    } else {
      this.error.set('Identifiant inventaire invalide.');
    }
  }

  loadResume(): void {
    this.loading.set(true);
    this.error.set(null);

    this.varianceService.getResumeVariances(this.inventaireId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          this.resume.set(data);
        },
        error: (err) => {
          console.error(err);
          this.error.set(
            err?.error?.message || 'Erreur lors du chargement du résumé des variances.'
          );
        }
      });
  }

  lancerVariances(): void {
    this.lancementEnCours.set(true);
    this.error.set(null);

    this.varianceService.lancerVariances(this.inventaireId)
      .pipe(finalize(() => this.lancementEnCours.set(false)))
      .subscribe({
        next: () => {
          this.loadResume();
        },
        error: (err) => {
          console.error(err);
          this.error.set(
            err?.error?.message || 'Erreur lors du lancement des variances.'
          );
        }
      });
  }

  imprimerPdf(): void {
    this.loadingPdf.set(true);

    this.varianceService.imprimerResumeVariancesPdf(this.inventaireId)
      .pipe(finalize(() => this.loadingPdf.set(false)))
      .subscribe({
        next: (blob: Blob) => {
          const fileURL = URL.createObjectURL(blob);
          window.open(fileURL, '_blank');
        },
        error: (err) => {
          console.error(err);
          this.error.set(
            err?.error?.message || 'Erreur lors de la génération du PDF.'
          );
        }
      });
  }

  trackByLigne = (_: number, item: any) => item.id;

  formatNumber(value: number | null | undefined, digits = 2): string {
    return Number(value || 0).toLocaleString('fr-FR', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    });
  }
}
