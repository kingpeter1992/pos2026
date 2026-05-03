import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, Optional } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { CommandeAchatRequest, CommandeAchatResponse } from '../../models/commande-achat.model';
import { CommandeAchatStore } from '../../service/achat/CommandeAchatStore';
import { take, finalize, combineLatest, map, Observable, startWith, BehaviorSubject, Subject, takeUntil, switchMap } from 'rxjs';
import { ProduitStoreService } from '../../../produits/core/produit-store.service';
import { FournisseurStore } from '../../service/facturefoiunrisseur/FournisseurStore';
import { FournisseurResponse } from '../../../produits/models/fournisseur.model';
import { ProduitResponse } from '../../../produits/models/produit.model';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ProduitSelectionDialogComponent } from '../produit-selection-dialog-component/produit-selection-dialog-component';
import { BarcodeScannerDialogComponent } from '../barcode-scanner-dialog-component/barcode-scanner-dialog-component';
import { CreateProduitDialogComponent } from '../create-produit-dialog-component/create-produit-dialog-component';
import { Toast } from '../../../../shares/services/toast/toast';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import { TauxEchange } from '../../../caisse/components/taux-echange/taux-echange';
import { CaisseStoreService } from '../../../caisse/services/CaisseServiceStore';
export interface CommandeDialogData {
  commandeId?: number;
  mode?: 'create' | 'edit' | 'view';
  commande?: any;
}

@Component({
  selector: 'app-commandes-fournisseurs-component',
  templateUrl: './commandes-fournisseurs-component.html',
  styleUrl: './commandes-fournisseurs-component.css',
  standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush


})
export class CommandesFournisseursComponent implements OnInit, OnDestroy {
  form!: FormGroup;

  loading = false;
  loadingTaux = false;

  successMessage = '';
  errorMessage = '';

  isEditMode = false;
  commandeId: number | null = null;

  fournisseurs$!: Observable<FournisseurResponse[]>;
  produits$!: Observable<ProduitResponse[]>;
  filteredFournisseurs$!: Observable<FournisseurResponse[]>;

  montantTotal$ = new BehaviorSubject<number>(0);
  private destroy$ = new Subject<void>();

  private fournisseursCache: FournisseurResponse[] = [];
  private produitsCache: ProduitResponse[] = [];

  dernierTaux = 0;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private commandeAchatStore: CommandeAchatStore,
    private fournisseurStore: FournisseurStore,
    private produitStore: ProduitStoreService,
    private caisseStore: CaisseStoreService,
    private toast: Toast,
    private cdr: ChangeDetectorRef,
    private dialogRef: MatDialogRef<CommandesFournisseursComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.isEditMode = this.data?.mode === 'edit';
    this.commandeId = this.data?.commandeId ? Number(this.data.commandeId) : null;

    this.initForm();
    this.initStreams();
    this.loadData();
    this.bindCaches();
    this.initFournisseurAutocomplete();
    this.listenMontantTotal();
    this.listenTauxGlobal();
    this.chargerDernierTauxActif();

    if (this.isEditMode) {
      if (this.data?.commande) {
        this.patchCommandeToForm(this.data.commande);
        return;
      }

      if (this.commandeId) {
        const commandeStore = this.commandeAchatStore.getById(this.commandeId);

        if (commandeStore) {
          this.patchCommandeToForm(commandeStore);
          return;
        }

        this.loadCommandeForEdit(this.commandeId);
        return;
      }
    }

    this.ajouterLigne();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.form = this.fb.group({
      fournisseur: [null, Validators.required],
      fournisseurId: [null, Validators.required],
      reference: [''],
      dateCommande: [this.getToday(), Validators.required],
      dateLivraisonPrevue: [null],
      observation: [''],

      // Devise principale système
      devise: ['CDF', Validators.required],

      // Taux visible dans l'entête/résumé
      taux: [0, [Validators.required, Validators.min(0)]],

      lignes: this.fb.array([])
    });
  }

  private initStreams(): void {
    this.fournisseurs$ = this.fournisseurStore.fournisseurs$;
    this.produits$ = this.produitStore.produits$;
  }

  private loadData(): void {
    this.fournisseurStore.loadIfNeeded().pipe(take(1)).subscribe();
    this.produitStore.loadIfNeeded().pipe(take(1)).subscribe();
  }

  private bindCaches(): void {
    this.fournisseurs$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.fournisseursCache = data ?? [];
      });

    this.produits$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.produitsCache = data ?? [];
      });
  }

  private chargerDernierTauxActif(): void {
    this.loadingTaux = true;

    this.caisseStore.loadTauxActif()
      .pipe(take(1))
      .subscribe({
        next: (taux) => {
          this.dernierTaux = Number(taux?.taux ?? 0);

          if (!this.isEditMode) {
            this.form.patchValue({
              devise: 'CDF',
              taux: this.dernierTaux
            }, { emitEvent: true });
          }

          this.loadingTaux = false;
          this.recalculerMontantTotal();
        },
        error: (err) => {
          console.error(err);
          this.dernierTaux = 0;
          this.loadingTaux = false;
          this.toast.warning('Aucun taux de change actif trouvé.');
        }
      });
  }

  private listenTauxGlobal(): void {
    this.form.get('taux')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(taux => {
        const value = Number(taux || 0);

        this.lignes.controls.forEach(ctrl => {
          ctrl.get('tauxChangeUtilise')?.setValue(value, { emitEvent: false });
        });

        this.recalculerMontantTotal();
      });
  }

  get lignes(): FormArray {
    return this.form.get('lignes') as FormArray;
  }

  get montantTotal(): number {
    return this.montantTotal$.value;
  }

  get fournisseurControl(): AbstractControl | null {
    return this.form.get('fournisseur');
  }

  private createLigneForm(data?: any): FormGroup {
    const taux = Number(
      data?.tauxChangeUtilise ??
      data?.taux ??
      this.form?.get('taux')?.value ??
      this.dernierTaux ??
      0
    );

    return this.fb.group({
      id: [data?.id ?? null],

      produitId: [data?.produitId ?? null, Validators.required],
      produitNom: [data?.produitNom ?? ''],
      produitCategorie: [data?.produitCategorie ?? ''],
      codeBarres: [data?.codeBarres ?? ''],

      quantite: [
        Number(data?.quantite ?? data?.quantiteCommandee ?? 1),
        [Validators.required, Validators.min(1)]
      ],

      // FC principal
      prixUnitaire: [
        Number(data?.prixUnitaire ?? data?.prixUnitaireFc ?? 0),
        [Validators.required, Validators.min(0)]
      ],

      remise: [
        Number(data?.remise ?? 0),
        [Validators.min(0)]
      ],

      // Caché côté HTML, envoyé au backend
      tauxChangeUtilise: [taux],

      prixUnitaireFc: [Number(data?.prixUnitaireFc ?? 0)],
      prixUnitaireUsd: [Number(data?.prixUnitaireUsd ?? 0)],

      montantLigneFc: [Number(data?.montantLigneFc ?? data?.montantLigne ?? 0)],
      montantLigneUsd: [Number(data?.montantLigneUsd ?? 0)],

      quantiteRecue: [Number(data?.quantiteRecue ?? 0)],
      montantLigne: [Number(data?.montantLigne ?? 0)]
    });
  }

  addLigne(data?: any): void {
    const ligne = this.createLigneForm(data);
    this.lignes.push(ligne);
    this.listenLigneChanges(ligne);
    this.recalculerMontantTotal();
  }

  ajouterLigne(): void {
    this.addLigne();

    setTimeout(() => {
      const container = document.querySelector('.erp-lines-container');
      container?.scrollTo({
        top: (container as HTMLElement).scrollHeight,
        behavior: 'smooth'
      });
    });
  }

  clearLignes(): void {
    while (this.lignes.length > 0) {
      this.lignes.removeAt(0);
    }

    this.recalculerMontantTotal();
  }

  supprimerLigne(index: number): void {
    if (this.lignes.length <= 1) {
      return;
    }

    this.lignes.removeAt(index);
    this.recalculerMontantTotal();
  }

  private getLigneGroup(index: number): FormGroup {
    return this.lignes.at(index) as FormGroup;
  }

  private listenMontantTotal(): void {
    this.lignes.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.recalculerMontantTotal());

    this.recalculerMontantTotal();
  }

  private listenLigneChanges(ligne: FormGroup): void {
    ligne.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.recalculerMontantTotal());
  }

  private recalculerMontantTotal(): void {
    const totalFc = this.lignes.controls.reduce((sum, _, index) => {
      return sum + this.getSousTotal(index);
    }, 0);

    this.montantTotal$.next(+totalFc.toFixed(2));
  }

  getSousTotal(index: number): number {
    const ligne = this.getLigneGroup(index);

    const quantite = Number(ligne.get('quantite')?.value || 0);
    const prixUnitaireFc = Number(ligne.get('prixUnitaire')?.value || 0);
    const remiseFc = Number(ligne.get('remise')?.value || 0);

    const taux = Number(
      ligne.get('tauxChangeUtilise')?.value ||
      this.form.get('taux')?.value ||
      0
    );

    const montantLigneFc = Math.max(0, (quantite * prixUnitaireFc) - remiseFc);
    const montantLigneUsd = taux > 0 ? montantLigneFc / taux : 0;
    const prixUnitaireUsd = taux > 0 ? prixUnitaireFc / taux : 0;

    ligne.patchValue({
      tauxChangeUtilise: taux,
      prixUnitaireFc: +prixUnitaireFc.toFixed(2),
      prixUnitaireUsd: +prixUnitaireUsd.toFixed(2),
      montantLigneFc: +montantLigneFc.toFixed(2),
      montantLigneUsd: +montantLigneUsd.toFixed(2),
      montantLigne: +montantLigneFc.toFixed(2)
    }, { emitEvent: false });

    return montantLigneFc;
  }

  calculMontantFc(): number {
    return this.lignes.controls.reduce((sum, _, index) => {
      return sum + this.getSousTotal(index);
    }, 0);
  }

  calculMontantUsd(): number {
    const taux = Number(this.form.get('taux')?.value || 0);
    const montantFc = this.calculMontantFc();

    return taux > 0 ? +(montantFc / taux).toFixed(2) : 0;
  }

  private loadCommandeForEdit(id: number): void {
    this.loading = true;
    this.cdr.detectChanges();
    this.resetMessages();

    const commande = this.commandeAchatStore.getById(id);

    if (commande) {
      this.patchCommandeToForm(commande);
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.commandeAchatStore.findById(id)
      .pipe(
        take(1),
        finalize(() => {
          setTimeout(() => {
            this.loading = false;
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe({
        next: (commande: CommandeAchatResponse) => {
          if (!commande) {
            this.errorMessage = 'Commande introuvable.';
            return;
          }

          this.patchCommandeToForm(commande);
        },
        error: (err) => {
          console.error(err);
          this.errorMessage =
            err?.error?.message || 'Erreur lors du chargement de la commande.';
        }
      });
  }

  private patchCommandeToForm(commande: CommandeAchatResponse): void {
    const fournisseurTrouve =
      this.fournisseursCache.find(f => Number(f.id) === Number(commande.fournisseurId)) || null;

    const taux = Number(
      (commande as any).tauxChangeUtilise ??
      commande.taux ??
      this.dernierTaux ??
      0
    );

    this.form.patchValue({
      fournisseur: fournisseurTrouve,
      fournisseurId: fournisseurTrouve?.id ?? commande.fournisseurId ?? null,
      reference: commande.refCommande ?? commande.reference ?? '',
      dateCommande: this.toInputDate(commande.dateCommande),
      dateLivraisonPrevue: commande.datePrevue
        ? this.toInputDate(commande.datePrevue)
        : null,
      devise: commande.devise ?? 'CDF',
      taux,
      observation: commande.observation ?? ''
    });

    this.clearLignes();

    const lignes = commande.lignes ?? [];

    if (!lignes.length) {
      this.addLigne();
      return;
    }

    lignes.forEach((item: any) => {
      const produitTrouve = this.produitsCache.find(
        p => Number(p.id) === Number(item.produitId)
      );

      this.addLigne({
        id: item.id ?? null,
        produitId: item.produitId ?? null,
        produitNom: item.produitNom ?? produitTrouve?.nom ?? '',
        produitCategorie:
          item.produitCategorie ??
          (produitTrouve as any)?.categorie?.nom ??
          (produitTrouve as any)?.categorieNom ??
          '',
        codeBarres: item.codeBarres ?? produitTrouve?.codeBarres ?? '',
        quantite: Number(item.quantite ?? item.quantiteCommandee ?? 1),
        prixUnitaire: Number(item.prixUnitaireFc ?? item.prixUnitaire ?? 0),
        remise: Number(item.remise ?? 0),

        tauxChangeUtilise: Number(item.tauxChangeUtilise ?? taux),

        prixUnitaireFc: Number(item.prixUnitaireFc ?? 0),
        prixUnitaireUsd: Number(item.prixUnitaireUsd ?? 0),
        montantLigneFc: Number(item.montantLigneFc ?? item.montantLigne ?? 0),
        montantLigneUsd: Number(item.montantLigneUsd ?? 0),

        quantiteRecue: Number(item.quantiteRecue ?? 0),
        montantLigne: Number(item.montantLigne ?? 0)
      });
    });

    this.recalculerMontantTotal();
  }

  displayFournisseur(value: FournisseurResponse | string | null): string {
    return typeof value === 'string' ? value : value?.nom ?? '';
  }

  onFournisseurSelected(fournisseur: FournisseurResponse): void {
    this.form.patchValue({
      fournisseur,
      fournisseurId: fournisseur.id
    });
  }

  private initFournisseurAutocomplete(): void {
    this.filteredFournisseurs$ = combineLatest([
      this.fournisseurs$,
      this.fournisseurControl!.valueChanges.pipe(startWith(''))
    ]).pipe(
      map(([fournisseurs, value]) => {
        const keyword = this.normalizeText(value);

        if (!keyword) {
          return fournisseurs;
        }

        return fournisseurs.filter(f =>
          this.normalizeText(f.nom).includes(keyword) ||
          this.normalizeText(f.telephone).includes(keyword) ||
          this.normalizeText(f.email).includes(keyword)
        );
      })
    );
  }

  onProduitIdBlur(index: number): void {
    this.resetMessages();

    const ligne = this.getLigneGroup(index);
    const produitId = Number(ligne.get('produitId')?.value);

    if (!produitId) {
      this.viderProduitLigne(index);
      return;
    }

    const produit = this.produitsCache.find(p => Number(p.id) === produitId);

    if (!produit) {
      this.viderProduitLigne(index);
      this.errorMessage = `Aucun produit trouvé pour l'ID ${produitId}`;
      return;
    }

    this.affecterProduitALigne(index, produit);
  }

  ouvrirSelectionProduit(index: number): void {
    const dialogRef = this.dialog.open(ProduitSelectionDialogComponent, {
      width: '1100px',
      maxWidth: '95vw',
      height: '85vh',
      panelClass: 'full-dialog'
    });

    dialogRef.afterClosed()
      .pipe(take(1))
      .subscribe((produit: ProduitResponse | undefined) => {
        if (produit) {
          this.affecterProduitALigne(index, produit);
        }
      });
  }

  scannerProduit(index: number): void {
    this.produitStore.loadIfNeeded()
      .pipe(
        take(1),
        switchMap((produits: ProduitResponse[]) => {
          this.produitsCache = produits ?? [];

          const dialogRef = this.dialog.open(BarcodeScannerDialogComponent, {
            width: '700px',
            disableClose: true
          });

          return dialogRef.afterClosed().pipe(take(1));
        })
      )
      .subscribe({
        next: (barcode: string | null) => {
          if (!barcode?.trim()) {
            this.toast.warning('Aucun code-barres détecté.');
            return;
          }

          const barcodeNormalise = this.normalizeText(barcode);

          const produit = this.produitsCache.find(
            p => this.normalizeText(p.codeBarres || '') === barcodeNormalise
          );

          if (produit) {
            this.affecterProduitALigne(index, produit);
            this.toast.success('Produit trouvé et affecté à la ligne.');
            return;
          }

          this.ouvrirCreationProduitDepuisScan(index, barcode);
        },
        error: (err) => {
          console.error('Erreur scannerProduit', err);
          this.toast.error('Erreur lors du chargement ou du scan du produit.');
        }
      });
  }

  ouvrirCreationProduitDepuisScan(index: number, barcode: string): void {
    const dialogRef = this.dialog.open(CreateProduitDialogComponent, {
      width: '95vw',
      maxWidth: '95vw',
      height: '92vh',
      maxHeight: '92vh',
      autoFocus: false,
      panelClass: 'full-dialog',
      data: { codeBarres: barcode }
    });

    dialogRef.afterClosed()
      .pipe(take(1))
      .subscribe((produitCree: ProduitResponse | undefined) => {
        if (produitCree) {
          this.affecterProduitALigne(index, produitCree);
        }
      });
  }

  affecterProduitALigne(index: number, produit: ProduitResponse): void {
    this.resetMessages();

    if (this.produitDejaAjoute(index, Number(produit.id))) {
      this.errorMessage = `Le produit ID ${produit.id} est déjà sur une autre ligne.`;
      return;
    }

    const ligne = this.getLigneGroup(index);
    const taux = Number(this.form.get('taux')?.value || this.dernierTaux || 0);

    ligne.patchValue({
      produitId: produit.id,
      produitNom: produit.nom ?? '',
      produitCategorie:
        (produit as any).categorie?.nom ||
        (produit as any).categorieNom ||
        '',
      codeBarres: produit.codeBarres ?? '',

      // Prix achat en FC
      prixUnitaire: Number((produit as any).prixAchat ?? 0),

      // Taux caché ligne
      tauxChangeUtilise: taux
    });

    ligne.get('produitId')?.markAsTouched();
    ligne.get('prixUnitaire')?.markAsTouched();

    this.recalculerMontantTotal();
  }

  viderProduitLigne(index: number): void {
    const ligne = this.getLigneGroup(index);

    ligne.patchValue({
      produitNom: '',
      produitCategorie: '',
      codeBarres: '',
      prixUnitaire: 0,
      prixUnitaireFc: 0,
      prixUnitaireUsd: 0,
      montantLigneFc: 0,
      montantLigneUsd: 0,
      montantLigne: 0
    });

    this.recalculerMontantTotal();
  }

  private produitDejaAjoute(indexCourant: number, produitId: number): boolean {
    return this.lignes.controls.some((ctrl, i) => {
      if (i === indexCourant) {
        return false;
      }

      return Number(ctrl.get('produitId')?.value) === produitId;
    });
  }

  enregistrer(): void {
    this.resetMessages();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.buildRequest();

    this.loading = true;
    this.cdr.detectChanges();

    const request$ = this.isEditMode && this.commandeId
      ? this.commandeAchatStore.update(this.commandeId, payload)
      : this.commandeAchatStore.create(payload);

    request$
      .pipe(
        take(1),
        finalize(() => {
          setTimeout(() => {
            this.loading = false;
            this.cdr.detectChanges();
          });
        })
      )
      .subscribe({
        next: (res: any) => {
          if (this.isEditMode && res) {
            this.commandeAchatStore.updateInStore?.(res);
          }

          this.toast.success(
            this.isEditMode
              ? 'Commande modifiée avec succès.'
              : 'Commande enregistrée avec succès.'
          );

          this.successMessage = this.isEditMode
            ? 'Commande modifiée avec succès.'
            : 'Commande enregistrée avec succès.';

          this.dialogRef.close(true);
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = err?.error?.message || (
            this.isEditMode
              ? 'Erreur lors de la modification.'
              : 'Erreur lors de l’enregistrement.'
          );
        }
      });
  }

  private buildRequest(): CommandeAchatRequest {
    const taux = Number(this.form.get('taux')?.value || 0);
    const montantTotalFc = +this.calculMontantFc().toFixed(2);
    const montantTotalUsd = taux > 0 ? +(montantTotalFc / taux).toFixed(2) : 0;

    return {
      fournisseurId: Number(this.form.get('fournisseurId')?.value),
      reference: this.form.get('reference')?.value,
      dateCommande: this.form.get('dateCommande')?.value,
      dateLivraisonPrevue: this.form.get('dateLivraisonPrevue')?.value,
      observation: this.form.get('observation')?.value,

      devise: 'CDF',
      taux,
      tauxChangeUtilise: taux,

      montantTotalFc,
      montantTotalUsd,

      lignes: this.lignes.controls.map(ligne => ({
        id: ligne.get('id')?.value ? Number(ligne.get('id')?.value) : null,
        produitId: Number(ligne.get('produitId')?.value),
        quantite: Number(ligne.get('quantite')?.value || 0),

        prixUnitaire: Number(ligne.get('prixUnitaire')?.value || 0),
        remise: Number(ligne.get('remise')?.value || 0),

        tauxChangeUtilise: Number(ligne.get('tauxChangeUtilise')?.value || taux),

        prixUnitaireFc: Number(ligne.get('prixUnitaireFc')?.value || 0),
        prixUnitaireUsd: Number(ligne.get('prixUnitaireUsd')?.value || 0),

        montantLigneFc: Number(ligne.get('montantLigneFc')?.value || 0),
        montantLigneUsd: Number(ligne.get('montantLigneUsd')?.value || 0)
      }))
    } as any;
  }

  private toInputDate(value: string | Date | null | undefined): string {
    if (!value) {
      return this.getToday();
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return this.getToday();
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private resetMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  private normalizeText(value: unknown): string {
    if (value == null) {
      return '';
    }

    if (typeof value === 'string') {
      return value.toLowerCase().trim();
    }

    if (typeof value === 'object' && value !== null && 'nom' in value) {
      return String((value as { nom?: string }).nom ?? '').toLowerCase().trim();
    }

    return String(value).toLowerCase().trim();
  }

  private getToday(): string {
    return new Date().toISOString().substring(0, 10);
  }

  formatFc(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  }

  formatUsd(value: number): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(value || 0));
  }

  trackByIndex(index: number): number {
    return index;
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

exportLignesToExcel(): void {
  if (!this.lignes || this.lignes.length === 0) {
    return;
  }

  const toNumber = (v: any): number => {
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
  };

  const clean = (v: any): string =>
    String(v ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\u202F|\u00A0/g, ' ')
      .replace(/[’‘]/g, "'")
      .replace(/[“”]/g, '"');

  const reference = this.form?.get('reference')?.value || 'commande';
  const taux = toNumber(this.form.get('taux')?.value || 0);

  const rows = this.lignes.controls.map((ligne: any, index: number) => {
    const value = ligne.value || {};

    return [
      index + 1,
      value.produitId || '',
      clean(value.produitNom || ''),
      clean(value.produitCategorie || ''),
      value.codeBarres || '',
      toNumber(value.quantite),
      toNumber(value.prixUnitaireFc),
      toNumber(value.prixUnitaireUsd),
      toNumber(value.remise),
      toNumber(value.tauxChangeUtilise || taux),
      toNumber(value.montantLigneFc),
      toNumber(value.montantLigneUsd)
    ];
  });

  const header = [
    'N° Ligne',
    'ID Produit',
    'Produit',
    'Categorie',
    'Code-barres',
    'Quantite',
    'Prix unitaire FC',
    'Prix unitaire USD',
    'Remise FC',
    'Taux utilise',
    'Sous-total FC',
    'Sous-total USD'
  ];

  const title = [`EXPORTATION DES LIGNES DE COMMANDE - ${reference}`];
  const info = [
    [`Reference : ${reference}`, '', '', '', '', `Taux : ${taux}`, '', '', '', '', '', ''],
    [`Date export : ${new Date().toLocaleString('fr-FR').replace(/\u202F|\u00A0/g, ' ')}`, '', '', '', '', '', '', '', '', '', '', '']
  ];

  const totalRow = [
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'TOTAL',
    taux,
    this.calculMontantFc(),
    this.calculMontantUsd()
  ];

  const data: any[][] = [
    title,
    [],
    ...info,
    [],
    header,
    ...rows,
    totalRow
  ];

  const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);

  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 4 } },
    { s: { r: 2, c: 5 }, e: { r: 2, c: 8 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: 4 } }
  ];

  worksheet['!cols'] = [
    { wch: 10 },
    { wch: 12 },
    { wch: 32 },
    { wch: 20 },
    { wch: 20 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 }
  ];

  worksheet['!freeze'] = { xSplit: 0, ySplit: 6 };

  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:L1');
  const headerRowIndex = 5;
  const totalRowIndex = data.length - 1;

  const border = {
    top: { style: 'thin', color: { rgb: 'CBD5E1' } },
    bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
    left: { style: 'thin', color: { rgb: 'CBD5E1' } },
    right: { style: 'thin', color: { rgb: 'CBD5E1' } }
  };

  const titleStyle = {
    font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '0F172A' } },
    alignment: { horizontal: 'center', vertical: 'center' }
  };

  const infoStyle = {
    font: { bold: true, sz: 11, color: { rgb: '334155' } },
    fill: { fgColor: { rgb: 'F8FAFC' } },
    alignment: { vertical: 'center' }
  };

  const headerStyle = {
    font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '2563EB' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border
  };

  const bodyStyle = {
    font: { sz: 10, color: { rgb: '0F172A' } },
    alignment: { vertical: 'center' },
    border
  };

  const totalStyle = {
    font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '16A34A' } },
    alignment: { vertical: 'center' },
    border
  };

  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = worksheet[cellRef];
      if (!cell) continue;

      if (R === 0) {
        cell.s = titleStyle;
      } else if (R === 2 || R === 3) {
        cell.s = infoStyle;
      } else if (R === headerRowIndex) {
        cell.s = headerStyle;
      } else if (R === totalRowIndex) {
        cell.s = totalStyle;
      } else if (R > headerRowIndex) {
        cell.s = {
          ...bodyStyle,
          fill: {
            fgColor: {
              rgb: R % 2 === 0 ? 'F8FAFC' : 'FFFFFF'
            }
          }
        };
      }
    }
  }

  for (let R = headerRowIndex + 1; R <= totalRowIndex; R++) {
    for (const C of [5, 6, 7, 8, 9, 10, 11]) {
      const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
      if (worksheet[cellRef]) {
        worksheet[cellRef].z = C === 7 || C === 11 ? '#,##0.00' : '#,##0';
        worksheet[cellRef].s = {
          ...(worksheet[cellRef].s || {}),
          alignment: { horizontal: 'right', vertical: 'center' }
        };
      }
    }
  }

  worksheet['!autofilter'] = {
    ref: `A6:L${totalRowIndex + 1}`
  };

  const workbook: XLSX.WorkBook = {
    Sheets: { 'Lignes commande': worksheet },
    SheetNames: ['Lignes commande']
  };

  const excelBuffer: ArrayBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array'
  });

  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
  });

  saveAs(blob, `lignes-${clean(reference)}.xlsx`);
}
}
