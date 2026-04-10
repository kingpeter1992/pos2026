import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, Optional } from '@angular/core';
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
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
export interface CommandeDialogData {
  commandeId?: number;
  mode?: 'create' | 'edit' | 'view';
  commande?: any;
}

@Component({
  selector: 'app-commandes-fournisseurs-component',
  templateUrl: './commandes-fournisseurs-component.html',
  styleUrl: './commandes-fournisseurs-component.css',
  standalone: false
})
export class CommandesFournisseursComponent implements OnInit, OnDestroy {
  form!: FormGroup;

  loading = false;
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

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private dialog: MatDialog,
    private commandeAchatStore: CommandeAchatStore,
    private fournisseurStore: FournisseurStore,
    private produitStore: ProduitStoreService,
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
      devise: ['USD', Validators.required],
      taux: [1, [Validators.required, Validators.min(0)]],
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
      prixUnitaire: [
        Number(data?.prixUnitaire ?? 0),
        [Validators.required, Validators.min(0)]
      ],
      remise: [
        Number(data?.remise ?? 0),
        [Validators.min(0)]
      ],
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

    this.form.patchValue({
      fournisseur: fournisseurTrouve,
      fournisseurId: fournisseurTrouve?.id ?? commande.fournisseurId ?? null,
      reference: commande.refCommande ?? commande.reference ?? '',
      dateCommande: this.toInputDate(commande.dateCommande),
      dateLivraisonPrevue: commande.datePrevue
        ? this.toInputDate(commande.datePrevue)
        : null,
      devise: commande.devise ?? 'USD',
      taux: commande.taux ?? 1,
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
        prixUnitaire: Number(item.prixUnitaire ?? 0),
        remise: Number(item.remise ?? 0),
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
    const total = this.lignes.controls.reduce((sum, _, index) => {
      return sum + this.getSousTotal(index);
    }, 0);

    this.montantTotal$.next(total);
  }

  getSousTotal(index: number): number {
    const ligne = this.getLigneGroup(index);
    const quantite = Number(ligne.get('quantite')?.value || 0);
    const prixUnitaire = Number(ligne.get('prixUnitaire')?.value || 0);
    const remise = Number(ligne.get('remise')?.value || 0);

    return Math.max(0, (quantite * prixUnitaire) - remise);
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
      width: '1200px',
      maxWidth: '95vw',
      height: '90vh',
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

    ligne.patchValue({
      produitId: produit.id,
      produitNom: produit.nom ?? '',
      produitCategorie:
        (produit as any).categorie?.nom ||
        (produit as any).categorieNom ||
        '',
      codeBarres: produit.codeBarres ?? '',
      prixUnitaire: (produit as any).prixAchat ?? 0
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
      prixUnitaire: 0
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
    return {
      fournisseurId: Number(this.form.get('fournisseurId')?.value),
      reference: this.form.get('reference')?.value,
      dateCommande: this.form.get('dateCommande')?.value,
      dateLivraisonPrevue: this.form.get('dateLivraisonPrevue')?.value,
      observation: this.form.get('observation')?.value,
      lignes: this.lignes.controls.map(ligne => ({
        id: ligne.get('id')?.value ? Number(ligne.get('id')?.value) : null,
        produitId: Number(ligne.get('produitId')?.value),
        quantite: Number(ligne.get('quantite')?.value || 0),
        prixUnitaire: Number(ligne.get('prixUnitaire')?.value || 0),
        remise: Number(ligne.get('remise')?.value || 0)
      })),
      taux: Number(this.form.get('taux')?.value || 0),
      devise: this.form.get('devise')?.value
    };
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

  private resetForm(): void {
    this.form.reset({
      fournisseur: null,
      fournisseurId: null,
      reference: '',
      dateCommande: this.getToday(),
      dateLivraisonPrevue: null,
      observation: '',
      devise: 'USD',
      taux: 1
    });

    this.clearLignes();
    this.addLigne();
    this.recalculerMontantTotal();
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

    const data = this.lignes.controls.map((ligne: any, index: number) => {
      const value = ligne.value || {};

      const quantite = Number(value.quantite || 0);
      const prixUnitaire = Number(value.prixUnitaire || 0);
      const remise = Number(value.remise || 0);
      const total = (quantite * prixUnitaire) - remise;

      return {
        'N° Ligne': index + 1,
        'ID Produit': value.produitId || '',
        'Produit': value.produitNom || '',
        'Catégorie': value.produitCategorie || '',
        'Code-barres': value.codeBarres || '',
        'Quantité': quantite,
        'Prix unitaire': prixUnitaire,
        'Remise': remise,
        'Sous-total': total
      };
    });

    const totalGeneral = data.reduce((sum, item) => {
      return sum + Number(item['Sous-total'] || 0);
    }, 0);

    data.push({
      'N° Ligne': '',
      'ID Produit': '',
      'Produit': '',
      'Catégorie': '',
      'Code-barres': '',
      'Quantité': '',
      'Prix unitaire': '',
      'Remise': 'TOTAL',
      'Sous-total': totalGeneral
    } as any);

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);

    const workbook: XLSX.WorkBook = {
      Sheets: { 'Lignes commande': worksheet },
      SheetNames: ['Lignes commande']
    };

    const excelBuffer: ArrayBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    });

    const blob: Blob = new Blob(
      [excelBuffer],
      {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
      }
    );

    const reference = this.form?.get('reference')?.value || 'commande';
    const fileName = `lignes-${reference}.xlsx`;

    saveAs(blob, fileName);
  }
}
