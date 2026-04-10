import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LigneReceptionRequest, LigneReceptionView, ReceptionAchatRequest, ReceptionAchatResponse } from '../../models/reception-achat.model';
import { CommandeAchatStore } from '../../service/achat/CommandeAchatStore';
import { ReceptionAchatStore } from '../../service/reception/ReceptionAchatStore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DepotStore } from '../../service/deposervice/DepotStore';
import { C } from '@angular/cdk/keycodes';

@Component({
  selector: 'app-receptions-component',
  templateUrl: './receptions-component.html',
  styleUrl: './receptions-component.css',
  standalone: false
})
export class ReceptionsComponent implements OnInit {
form!: FormGroup;
  commandeId: number | null = null;
  commande: any = null;
  loading = false;
  submitting = false;
  depots: any[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private commandeService: CommandeAchatStore,
    private receptionService: ReceptionAchatStore,
      private depotStore: DepotStore   // 👈 AJOUT

  ) {}

  ngOnInit(): void {
    this.initForm();

      this.depotStore.loadAll().subscribe({
        next: (data) => {
          this.depots = data || [];
          console.log('Départements chargés :', this.depots);
        },
        error: () => {
          this.snackBar.open('Erreur chargement dépôts', 'Fermer', { duration: 3000 });
        }
      });



    const idParam = this.route.snapshot.queryParamMap.get('commandeId');
    this.commandeId = idParam ? Number(idParam) : null;

    if (this.commandeId) {
      this.loadCommande();
    } else {
      this.snackBar.open('Aucune commande sélectionnée.', 'Fermer', {
        duration: 3000
      });
      this.router.navigate(['/admin/commandes-achats']);
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      commandeAchatId: [null, Validators.required],
      referenceBonReception: [''],
      dateReception: [this.today(), Validators.required],
      observateur: [''],
      depotId: [null, Validators.required],
      fournisseurId: [null, Validators.required],
      fraisTransport: [0],
      fraisDouane: [0],
      fraisManutention: [0],
      autresFrais: [0],
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
      quantiteCommandee: [ligne.quantiteCommandee],
      quantiteDejaRecue: [ligne.quantiteDejaRecue],
      quantiteRestante: [ligne.quantiteRestante],
      bloquee: [ligne.bloquee ?? false],
      depotId: [this.form.get('depotId')?.value ?? null],
      fournisseurId: [this.commande?.fournisseurId ?? null],
      quantiteRecue: [
        { value: ligne.quantiteRecue, disabled: ligne.bloquee },
        [Validators.required, Validators.min(0)]
      ],
      prixUnitaire: [ligne.prixUnitaire ?? null],
      commentaire: [ligne.commentaire ?? '']
    });
  }

  loadCommande(): void {
    if (!this.commandeId || !this.form) return;

    this.loading = true;

    const cmd = this.commandeService.getById(this.commandeId);
    console.log('cmd chargée :', cmd);

    if (!cmd) {
      this.loading = false;
      this.snackBar.open('Commande introuvable.', 'Fermer', {
        duration: 3000
      });
      return;
    }

    this.commande = cmd;

  this.form.patchValue({
  commandeAchatId: cmd.id ?? null,
  depotId: [this.form.get('depotId')?.value ?? null],
  fournisseurId: cmd.fournisseurId ?? cmd.fournisseurId ?? null,
  dateReception: this.today(),
  fraisTransport: Number(cmd?.fraisTransport ?? 0),
  fraisDouane: Number(cmd?.fraisDouane ?? 0),
  fraisManutention: Number(cmd?.fraisManutention ?? 0),
  autresFrais: Number(cmd?.autresFrais ?? 0)
});

    this.lignesFormArray.clear();

    const lignesMapped = (cmd.lignes ?? []).map((l: any) => {
      const quantiteCommandee = Number(
        l?.quantiteCommandee ?? l?.quantite ?? 0
      );
      const quantiteDejaRecue = Number(
        l?.quantiteRecue ?? l?.quantiteDejaRecue ?? 0
      );
      const quantiteRestante = Math.max(
        0,
        quantiteCommandee - quantiteDejaRecue
      );
      const bloquee = quantiteDejaRecue >= quantiteCommandee;

      return {
        produitId: Number(l?.produitId ?? l?.produit?.id ?? 0),
        produitNom: l?.produitNom || l?.nomProduit || l?.produit?.nom || '-',
        quantiteCommandee,
        quantiteDejaRecue,
        quantiteRestante,
        quantiteRecue: bloquee ? 0 : quantiteRestante,
        prixUnitaire: Number(
          l?.prixUnitaire ?? l?.prixAchatUnitaire ?? l?.prix ?? 0
        ),
        commentaire: '',
        bloquee
      };
    });

    lignesMapped.forEach((ligne: any) => {
      this.lignesFormArray.push(this.createLigneForm(ligne));
    });

    this.loading = false;
  }

  getTotalLignes(): number {
    return this.lignesFormArray.length;
  }

  getTotalLignesActives(): number {
    return this.lignesFormArray.controls.filter(ctrl => !ctrl.get('bloquee')?.value).length;
  }

  getTotalQuantiteRecue(): number {
    return this.lignesFormArray.controls.reduce((sum, ctrl) => {
      if (ctrl.get('bloquee')?.value) return sum;
      return sum + Number(ctrl.get('quantiteRecue')?.value || 0);
    }, 0);
  }

  getMontantTotalEstime(): number {
    return this.lignesFormArray.controls.reduce((sum, ctrl) => {
      if (ctrl.get('bloquee')?.value) return sum;

      const qte = Number(ctrl.get('quantiteRecue')?.value || 0);
      const pu = Number(ctrl.get('prixUnitaire')?.value || 0);
      return sum + qte * pu;
    }, 0);
  }

  getLignesBloqueesCount(): number {
    return this.lignesFormArray.controls.filter(
      ctrl => ctrl.get('bloquee')?.value
    ).length;
  }

  onQuantiteChange(index: number): void {
    const ligne = this.lignesFormArray.at(index);

    if (ligne.get('bloquee')?.value) {
      ligne.get('quantiteRecue')?.setValue(0, { emitEvent: false });
      return;
    }

    const qteRestante = Number(ligne.get('quantiteRestante')?.value || 0);
    let qteRecue = Number(ligne.get('quantiteRecue')?.value || 0);

    if (isNaN(qteRecue) || qteRecue < 0) {
      qteRecue = 0;
    }

    if (qteRecue > qteRestante) {
      qteRecue = qteRestante;
      this.snackBar.open(
        'La quantité reçue ne peut pas dépasser le reste à recevoir.',
        'Fermer',
        { duration: 3000 }
      );
    }

    ligne.get('quantiteRecue')?.setValue(qteRecue, { emitEvent: false });
  }

  onFraisChange(
    controlName:
      | 'fraisTransport'
      | 'fraisDouane'
      | 'fraisManutention'
      | 'autresFrais'
  ): void {
    let value = Number(this.form.get(controlName)?.value || 0);

    if (isNaN(value) || value < 0) {
      value = 0;
    }

    this.form.get(controlName)?.setValue(value, { emitEvent: false });
  }

  getFraisTransport(): number {
    return Number(this.form.get('fraisTransport')?.value || 0);
  }

  getFraisDouane(): number {
    return Number(this.form.get('fraisDouane')?.value || 0);
  }

  getFraisManutention(): number {
    return Number(this.form.get('fraisManutention')?.value || 0);
  }

  getAutresFrais(): number {
    return Number(this.form.get('autresFrais')?.value || 0);
  }

  getTotalFrais(): number {
    return (
      this.getFraisTransport() +
      this.getFraisDouane() +
      this.getFraisManutention() +
      this.getAutresFrais()
    );
  }

  getTotalGeneralEstime(): number {
    return this.getMontantTotalEstime() + this.getTotalFrais();
  }

 buildPayload(): ReceptionAchatRequest {
  const lignes: LigneReceptionRequest[] = this.lignesFormArray.controls
    .filter(ctrl => !ctrl.get('bloquee')?.value)
    .map(ctrl => ({
      produitId: Number(ctrl.get('produitId')?.value),
      quantiteRecue: Number(ctrl.get('quantiteRecue')?.value || 0),
      prixAchatUnitaire:
        ctrl.get('prixUnitaire')?.value !== null &&
        ctrl.get('prixUnitaire')?.value !== ''
          ? Number(ctrl.get('prixUnitaire')?.value)
          : undefined,
      commentaire: ctrl.get('commentaire')?.value || undefined
    }))
    .filter(l => l.quantiteRecue > 0);

  return {
    commandeAchatId:
      this.form.get('commandeAchatId')?.value != null
        ? Number(this.form.get('commandeAchatId')?.value)
        : undefined,

    referenceBonReception:
      this.form.get('referenceBonReception')?.value || undefined,

    dateReception:
      this.form.get('dateReception')?.value || undefined,

    observateur:
      this.form.get('observateur')?.value || undefined,

    depotId:
      this.form.get('depotId')?.value != null
        ? Number(this.form.get('depotId')?.value)
        : undefined,

    fournisseurId:
      this.form.get('fournisseurId')?.value != null
        ? Number(this.form.get('fournisseurId')?.value)
        : undefined,

    fraisTransport: this.getFraisTransport(),
    fraisDouane: this.getFraisDouane(),
    fraisManutention: this.getFraisManutention(),
    autresFrais: this.getAutresFrais(),

    lignes
  };
}

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open(
        'Veuillez compléter les champs obligatoires.',
        'Fermer',
        { duration: 3000 }
      );
      return;
    }

    const payload = this.buildPayload();

    console.log('Payload reception :', payload);

    if (!payload.lignes.length) {
      this.snackBar.open(
        'Veuillez saisir au moins une quantité reçue supérieure à 0.',
        'Fermer',
        { duration: 3500 }
      );
      return;
    }

    this.submitting = true;

    this.receptionService.create(payload).subscribe({
      next: (res: any) => {
        this.submitting = false;
        this.snackBar.open(
          'Réception enregistrée avec succès.',
          'Fermer',
          { duration: 3000 }
        );

        if (res?.id) {
          this.router.navigate(['/admin/receptions/details', res.id]);
        } else {
          this.router.navigate(['/admin/receptions']);
        }
      },
      error: (err: any) => {
        console.error(err);
        this.submitting = false;
        this.snackBar.open(
          err?.error?.message || 'Erreur lors de l’enregistrement de la réception.',
          'Fermer',
          { duration: 4000 }
        );
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/commandes-achats']);
  }

  private today(): string {
    return new Date().toISOString().substring(0, 10);
  }
}
