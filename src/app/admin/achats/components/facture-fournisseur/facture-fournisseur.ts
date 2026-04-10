import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable, take, combineLatest, startWith, map, finalize } from 'rxjs';
import { FournisseurResponse } from '../../../produits/models/fournisseur.model';
import { CommandeAchatResponse } from '../../models/commande-achat.model';
import { FactureFournisseurRequest } from '../../models/facture-fournisseur.model';
import { ReceptionAchatResponse } from '../../models/reception-achat.model';
import { CommandeAchatStore } from '../../service/achat/CommandeAchatStore';
import { FournisseurStore } from '../../service/facturefoiunrisseur/FournisseurStore';
import { ReceptionAchatStore } from '../../service/reception/ReceptionAchatStore';
import { FactureFournisseurStore } from '../../service/facturefoiunrisseur/FactureFournisseurStore';

@Component({
  selector: 'app-facture-fournisseur',
  templateUrl: './facture-fournisseur.html',
  styleUrl: './facture-fournisseur.css',
  standalone: false
})
export class FactureFournisseur implements OnInit {

  form!: FormGroup;

  loading = false;
  successMessage = '';
  errorMessage = '';

  fournisseurs$!: Observable<FournisseurResponse[]>;
  commandes$!: Observable<CommandeAchatResponse[]>;
  receptions$!: Observable<ReceptionAchatResponse[]>;

  filteredFournisseurs$!: Observable<FournisseurResponse[]>;
  filteredCommandes$!: Observable<CommandeAchatResponse[]>;
  filteredReceptions$!: Observable<ReceptionAchatResponse[]>;

  commandeAchatIdFromRoute: number | null = null;
  receptionIdFromRoute: number | null = null;
  fournisseurIdFromRoute: number | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private factureStore: FactureFournisseurStore,
    private fournisseurStore: FournisseurStore,
    private commandeStore: CommandeAchatStore,
    private receptionStore: ReceptionAchatStore
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.initStreams();
    this.loadData();
    this.readRouteParams();
    this.initAutocompletes();
  }

  private initForm(): void {
    this.form = this.fb.group({
      fournisseur: [null, Validators.required],
      fournisseurId: [null, Validators.required],

      commandeAchat: [null],
      commandeAchatId: [null],

      reception: [null],
      receptionId: [null],

      numeroFacture: ['', Validators.required],
      dateFacture: [this.getToday(), Validators.required],
      dateEcheance: [''],

      montantHt: [0, [Validators.min(0)]],
      montantTva: [0, [Validators.min(0)]],
      montantTtc: [0, [Validators.required, Validators.min(0)]],

      devise: ['USD', Validators.required],
      commentaire: ['']
    });
  }

  private initStreams(): void {
    this.fournisseurs$ = this.fournisseurStore.fournisseurs$;
    this.commandes$ = this.commandeStore.commandes$;
    this.receptions$ = this.receptionStore.receptions$;
  }

  private loadData(): void {
    this.fournisseurStore.loadIfNeeded().pipe(take(1)).subscribe();
    this.commandeStore.loadIfNeeded().pipe(take(1)).subscribe();
    this.receptionStore.loadIfNeeded().pipe(take(1)).subscribe();
  }

  private readRouteParams(): void {
    const fournisseurId = this.route.snapshot.queryParamMap.get('fournisseurId');
    const commandeId = this.route.snapshot.queryParamMap.get('commandeAchatId');
    const receptionId = this.route.snapshot.queryParamMap.get('receptionId');

    if (fournisseurId) {
      this.fournisseurIdFromRoute = Number(fournisseurId);
      const fournisseur = this.fournisseurStore.fournisseurSnapshot.find(f => f.id === this.fournisseurIdFromRoute);
      if (fournisseur) {
        this.onFournisseurSelected(fournisseur);
      }
    }

    if (commandeId) {
      this.commandeAchatIdFromRoute = Number(commandeId);
      const commande = this.commandeStore.snapshot.find((c: { id: number | null; }) => c.id === this.commandeAchatIdFromRoute);
      if (commande) {
        this.onCommandeSelected(commande);
      } else {
        this.form.patchValue({ commandeAchatId: this.commandeAchatIdFromRoute });
      }
    }

    if (receptionId) {
      this.receptionIdFromRoute = Number(receptionId);
      const reception = this.receptionStore.snapshot.find(r => r.id === this.receptionIdFromRoute);
      if (reception) {
        this.onReceptionSelected(reception);
      } else {
        this.form.patchValue({ receptionId: this.receptionIdFromRoute });
      }
    }
  }

  private initAutocompletes(): void {
    this.filteredFournisseurs$ = combineLatest([
      this.fournisseurs$,
      this.form.get('fournisseur')!.valueChanges.pipe(startWith(''))
    ]).pipe(
      map(([items, value]) => {
        const keyword = this.normalizeText(value);
        return items.filter(item =>
          this.normalizeText(item.nom).includes(keyword) ||
          this.normalizeText(item.telephone).includes(keyword) ||
          this.normalizeText(item.email).includes(keyword)
        );
      })
    );

    this.filteredCommandes$ = combineLatest([
      this.commandes$,
      this.form.get('commandeAchat')!.valueChanges.pipe(startWith(''))
    ]).pipe(
      map(([items, value]) => {
        const keyword = this.normalizeText(value);
        return items.filter(item =>
          this.normalizeText(item.reference).includes(keyword) ||
          this.normalizeText(item.fournisseurNom).includes(keyword)
        );
      })
    );

    this.filteredReceptions$ = combineLatest([
      this.receptions$,
      this.form.get('reception')!.valueChanges.pipe(startWith(''))
    ]).pipe(
      map(([items, value]) => {
        const keyword = this.normalizeText(value);
        return items.filter(item =>
          this.normalizeText(item.referenceBonReception).includes(keyword) ||
          String(item.commandeAchatId).includes(keyword)
        );
      })
    );
  }

  displayFournisseur(value: FournisseurResponse | string | null): string {
    return typeof value === 'string' ? value : value?.nom ?? '';
  }

  displayCommande(value: CommandeAchatResponse | string | null): string {
    if (typeof value === 'string') return value;
    return value ? `${value.reference} - ${value.fournisseurNom}` : '';
  }

  displayReception(value: ReceptionAchatResponse | string | null): string {
    if (typeof value === 'string') return value;
    return value ? `${value.referenceBonReception} - Cmd ${value.commandeAchatId}` : '';
  }

  onFournisseurSelected(fournisseur: FournisseurResponse): void {
    this.form.patchValue({
      fournisseur,
      fournisseurId: fournisseur.id
    });
  }

  onCommandeSelected(commande: CommandeAchatResponse): void {
    this.form.patchValue({
      commandeAchat: commande,
      commandeAchatId: commande.id
    });

    if (!this.form.get('fournisseurId')?.value && commande.fournisseurId) {
      const fournisseur = this.fournisseurStore.fournisseurSnapshot.find(f => f.id === commande.fournisseurId);
      if (fournisseur) {
        this.onFournisseurSelected(fournisseur);
      } else {
        this.form.patchValue({ fournisseurId: commande.fournisseurId });
      }
    }

    if (!this.form.get('montantTtc')?.value || Number(this.form.get('montantTtc')?.value) === 0) {
      this.form.patchValue({
        montantTtc: commande.montantTotal,
        montantHt: commande.montantTotal
      });
    }
  }

  onReceptionSelected(reception: ReceptionAchatResponse): void {
    this.form.patchValue({
      reception: reception,
      receptionId: reception.id
    });

    if (!this.form.get('commandeAchatId')?.value && reception.commandeAchatId) {
      this.form.patchValue({
        commandeAchatId: reception.commandeAchatId
      });
    }
  }

  get montantNetCalcule(): number {
    const ht = Number(this.form.get('montantHt')?.value || 0);
    const tva = Number(this.form.get('montantTva')?.value || 0);
    return ht + tva;
  }

  enregistrer(): void {
    this.resetMessages();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Veuillez renseigner correctement les champs obligatoires.';
      return;
    }

    const request = this.buildRequest();

    this.loading = true;

    this.factureStore.create(request).pipe(
      take(1),
      finalize(() => {
        this.loading = false;
      })
    ).subscribe({
      next: (created) => {
        this.successMessage = `Facture fournisseur enregistrée : ${created.numeroFacture}`;
        if (request.commandeAchatId) {
          this.router.navigate(['/achats/commandes', request.commandeAchatId]);
          return;
        }
        this.router.navigate(['/achats/factures-fournisseurs']);
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message ||
          'Erreur lors de l’enregistrement de la facture fournisseur.';
      }
    });
  }

  private buildRequest(): FactureFournisseurRequest {
    return {
      fournisseurId: Number(this.form.get('fournisseurId')?.value),
      commandeAchatId: this.toNullableNumber(this.form.get('commandeAchatId')?.value) as number,
      receptionId: this.toNullableNumber(this.form.get('receptionId')?.value) as number,
      numeroFacture: this.form.get('numeroFacture')?.value,
      dateFacture: this.form.get('dateFacture')?.value,
      dateEcheance: this.form.get('dateEcheance')?.value || null,
      montantHt: Number(this.form.get('montantHt')?.value || 0),
      montantTva: Number(this.form.get('montantTva')?.value || 0),
      montantTtc: Number(this.form.get('montantTtc')?.value || 0),
      devise: this.form.get('devise')?.value,
      commentaire: this.form.get('commentaire')?.value
    };
  }

  private toNullableNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    return Number(value);
  }

  private resetMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  private normalizeText(value: unknown): string {
    if (value == null) return '';

    if (typeof value === 'string') {
      return value.toLowerCase().trim();
    }

    if (typeof value === 'object' && value !== null) {
      if ('nom' in value) {
        return String((value as { nom?: string }).nom ?? '').toLowerCase().trim();
      }
      if ('reference' in value) {
        return String((value as { reference?: string }).reference ?? '').toLowerCase().trim();
      }
      if ('referenceBonReception' in value) {
        return String((value as { referenceBonReception?: string }).referenceBonReception ?? '').toLowerCase().trim();
      }
    }

    return String(value).toLowerCase().trim();
  }

  private getToday(): string {
    return new Date().toISOString().substring(0, 10);
  }
}
