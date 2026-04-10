import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CommandeAchatStore } from '../../service/achat/CommandeAchatStore';

@Component({
  selector: 'app-commande-achat-detail',
  templateUrl: './commande-achat-detail.html',
  styleUrl: './commande-achat-detail.css',
  standalone: false
})
export class CommandeAchatDetail implements OnInit, OnDestroy {

  commande$;
  loading$;
  error$;

  private destroy$ = new Subject<void>();
  private commandeId!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: CommandeAchatStore
  ) {

      this.commande$ = this.store.selectedCommande$;
  this.loading$ = this.store.loading$;
  this.error$ = this.store.error$;
  }

  ngOnInit(): void {
    this.commandeId = Number(this.route.snapshot.paramMap.get('id'));
    this.store.loadById(this.commandeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  valider(): void {
    this.store.valider(this.commandeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  annuler(): void {
    this.store.annuler(this.commandeId)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  allerReception(): void {
    this.router.navigate(['/achats/receptions/new'], {
      queryParams: { commandeAchatId: this.commandeId }
    });
  }

  allerFacture(): void {
    this.router.navigate(['/achats/factures/new'], {
      queryParams: { commandeAchatId: this.commandeId }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.store.clearSelected();
  }
}
