import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CaisseStoreService } from '../../services/CaisseServiceStore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import jsPDF from 'jspdf';
import { StorageService } from '../../../../auth/services/storage/storage-service';
import { CaisseSessionDto, TransactionCaisseDto, Devise, TypeTransaction, ModePaiement, CategorieOperation, OperationCaisseDTO } from '../../models/caisse.model';
import { Toast } from '../../../../shares/services/toast/toast';
import { OuvrirCaisseDialogComponent } from '../ouvrir-caisse-dialog-component/ouvrir-caisse-dialog-component';
import { CloturerCaisseDialogComponent } from '../cloturer-caisse-dialog-component/cloturer-caisse-dialog-component';

@Component({
  selector: 'app-caisse-dashboard',
  templateUrl: './caisse-dashboard.html',
  styleUrl: './caisse-dashboard.css',
  standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CaisseDashboard implements OnInit {
readonly store = inject(CaisseStoreService);

  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);
  private readonly storageService = inject(StorageService);
  private readonly toast = inject(Toast);

  session: CaisseSessionDto | null = null;
  historique: TransactionCaisseDto[] = [];
  filtered: TransactionCaisseDto[] = [];

  filterForm!: FormGroup;
  opForm!: FormGroup;

  isLoggedIn = false;
  tauxChange = 0;

  readonly devises: Devise[] = ['USD', 'CDF'];
  readonly types: TypeTransaction[] = ['ENCAISSEMENT', 'DECAISSEMENT'];
  readonly modes: ModePaiement[] = ['CASH', 'MOBILE_MONEY', 'BANQUE'];

  readonly categories: CategorieOperation[] = [
    'REMBOURSEMENT',
    'SALAIRE',
    'AUTRE',
    'ACHAT',
    'DEPENSE',
    'RECETTE'
  ];

  ngOnInit(): void {
    this.initForms();

    this.isLoggedIn = this.storageService.isLoggedIn();

    this.store.session$.subscribe(session => {
      this.session = session;
    });

    this.store.historique$.subscribe(list => {
      this.historique = list || [];
      this.applyFilters();
    });

    this.store.dernierTaux$.subscribe(taux => {
      this.tauxChange = taux || 0;
    });

    this.filterForm.valueChanges.subscribe(() => this.applyFilters());

    this.refresh();
    this.store.loadDernierTaux().subscribe();
  }

  private initForms(): void {
    this.filterForm = this.fb.group({
      q: [''],
      devise: ['' as '' | Devise],
      type: ['' as '' | TypeTransaction],
      mode: ['' as '' | ModePaiement],
      category: ['' as '' | CategorieOperation],
    });

    this.opForm = this.fb.group({
      type: ['ENCAISSEMENT' as TypeTransaction, Validators.required],
      devise: ['USD' as Devise, Validators.required],
      montant: [null, [Validators.required, Validators.min(0.01)]],
      category: ['AUTRE' as CategorieOperation, Validators.required],
      modePaiement: ['CASH' as ModePaiement, Validators.required],
      description: [''],
      reference: [''],
    });
  }

  refresh(): void {
    this.store.loadSessionOuverte(true).subscribe({
      next: () => {
        this.store.loadHistoriqueDuJour(true).subscribe();
      },
      error: () => {
        this.session = null;
        this.historique = [];
        this.filtered = [];
      }
    });
  }

  openOuvrirDialog(): void {
    const ref = this.dialog.open(OuvrirCaisseDialogComponent, {
      width: '640px',
      maxWidth: '96vw',
      panelClass: 'pro-dialog',
      disableClose: true,
      data: {}
    });

    ref.afterClosed().subscribe(dto => {
      if (!dto) return;

      this.store.ouvrirCaisse(dto).subscribe({
        next: () => {
          this.snack.open('Caisse ouverte avec succès', 'OK', { duration: 2500 });
          this.store.loadHistoriqueDuJour(true).subscribe();
        },
        error: e => {
          this.snack.open(
            e?.error?.message || 'Erreur ouverture caisse',
            'OK',
            { duration: 3500 }
          );
        }
      });
    });
  }

  openCloturerDialog(): void {
    const ref = this.dialog.open(CloturerCaisseDialogComponent, {
      width: '640px',
      maxWidth: '96vw',
      panelClass: 'pro-dialog',
      disableClose: true,
      data: { session: this.session }
    });

    ref.afterClosed().subscribe(dto => {
      if (!dto) return;

      this.store.cloturerCaisse(dto).subscribe({
        next: () => {
          this.snack.open('Caisse clôturée', 'OK', { duration: 2500 });
          this.refresh();
        },
        error: e => {
          this.snack.open(
            e?.error?.message || 'Erreur clôture caisse',
            'OK',
            { duration: 3500 }
          );
        }
      });
    });
  }

  submitOperation(): void {
    if (!this.session) {
      this.snack.open("Ouvre d'abord la caisse", 'OK', { duration: 2500 });
      return;
    }
    if (this.opForm.invalid) {
      this.opForm.markAllAsTouched();
      return;
    }

    const v = this.opForm.value;

const dto: OperationCaisseDTO = {
  type: v.type,
  devise: v.devise,
  montant: Number(v.montant),
  category: v.category,
  modePaiement: v.modePaiement,
  description: (v.description || '').trim(),
  reference: (v.reference || '').trim()
};

    if (!dto.reference) {
      dto.reference = `${dto.category}-${Date.now()}`;
    }

    this.store.effectuerOperation(dto).subscribe({
      next: () => this.afterOperationSuccess(),
      error: e => this.showOperationError(e)
    });
  }

  private afterOperationSuccess(): void {
    this.toast.success('Opération enregistrée avec succès');

    this.resetOperationForm();

    this.store.loadHistoriqueDuJour(true).subscribe();
    this.store.loadSessionOuverte(true).subscribe();
  }

  private showOperationError(e: any): void {
    this.snack.open(
      e?.error?.message || 'Erreur lors de l’opération',
      'OK',
      { duration: 5000 }
    );
  }

  resetOperationForm(): void {
    this.opForm.reset({
      type: 'ENCAISSEMENT',
      devise: 'USD',
      montant: null,
      category: 'AUTRE',
      modePaiement: 'CASH',
      description: '',
      reference: '',
    });
  }

  applyFilters(): void {
    const { q, devise, type, mode, category } = this.filterForm.value;
    const query = (q || '').toLowerCase().trim();

    this.filtered = this.historique.filter(t => {
      const matchQ =
        !query ||
        (t.description || '').toLowerCase().includes(query) ||
        (t.reference || '').toLowerCase().includes(query) ||
        (t.category || '').toLowerCase().includes(query) ||
        (t.modePaiement || '').toLowerCase().includes(query);

      const matchDevise = !devise || t.devise === devise;
      const matchType = !type || t.type === type;
      const matchMode = !mode || t.modePaiement === mode;
      const matchCategory = !category || t.category === category;

      return matchQ && matchDevise && matchType && matchMode && matchCategory;
    });
  }

  get soldeUSD(): number {
    return this.session?.soldeActuelUSD ?? 0;
  }

  get soldeCDF(): number {
    return this.session?.soldeActuelCDF ?? 0;
  }

  get totalEncUSD(): number {
    return this.sum('ENCAISSEMENT', 'USD');
  }

  get totalDecUSD(): number {
    return this.sum('DECAISSEMENT', 'USD');
  }

  get totalEncCDF(): number {
    return this.sum('ENCAISSEMENT', 'CDF');
  }

  get totalDecCDF(): number {
    return this.sum('DECAISSEMENT', 'CDF');
  }

  get totalNetUSD(): number {
    return this.totalEncUSD - this.totalDecUSD;
  }

  get totalNetCDF(): number {
    return this.totalEncCDF - this.totalDecCDF;
  }

  private sum(type: TypeTransaction, devise: Devise): number {
    return this.historique
      .filter(x => x.type === type && x.devise === devise)
      .reduce((acc, cur) => acc + Number(cur.montant || 0), 0);
  }

  async preview(op: TransactionCaisseDto): Promise<void> {
    if (!op) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 170]
    });

    const W = doc.internal.pageSize.getWidth();
    let y = 8;

    try {
      const logoDataUrl = await this.loadImageAsDataURL('assets/img/logop.jpg');
      doc.addImage(logoDataUrl, 'JPEG', (W - 16) / 2, y, 16, 16);
      y += 18;
    } catch {
      y += 2;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('PEACE SECURITY', W / 2, y, { align: 'center' });
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('REÇU MOUVEMENT CAISSE', W / 2, y, { align: 'center' });
    y += 6;

    doc.setDrawColor(170);
    doc.line(6, y, W - 6, y);
    y += 5;

    y = this.receiptRow(doc, y, 'Référence', op.reference ?? '');
    y = this.receiptRow(doc, y, 'Date', this.formatReceiptDate(op.dateTransaction));
    y = this.receiptRow(doc, y, 'Type', op.type ?? '');
    y = this.receiptRow(doc, y, 'Mode', op.modePaiement ?? '');
    y = this.receiptRow(doc, y, 'Catégorie', op.category ?? '');

    y += 3;
    doc.line(6, y, W - 6, y);
    y += 7;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Montant', 6, y);

    const sign = op.type === 'ENCAISSEMENT' ? '+' : '-';

    doc.text(
      `${sign} ${this.fmtNumber(op.montant)} ${op.devise}`,
      W - 6,
      y,
      { align: 'right' }
    );

    y += 8;

    doc.setFontSize(9);
    doc.text('Description', 6, y);
    y += 4;

    doc.setFont('helvetica', 'normal');

    const descLines = doc.splitTextToSize(op.description || '—', W - 12);
    doc.text(descLines, 6, y);

    y += descLines.length * 4 + 8;

    doc.setDrawColor(190);
    doc.line(6, y, W - 6, y);
    y += 6;

    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text('Merci pour votre confiance.', W / 2, y, { align: 'center' });

    doc.save(`recu_${op.reference || Date.now()}.pdf`);
  }

  private receiptRow(doc: jsPDF, y: number, label: string, value: string): number {
    const W = doc.internal.pageSize.getWidth();

    doc.setTextColor(20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);

    doc.text(label, 6, y);

    const clipped = doc.splitTextToSize((value ?? '').toString(), W - 36)[0] || '';
    doc.text(clipped, W - 6, y, { align: 'right' });

    return y + 5;
  }

  private formatReceiptDate(dt: any): string {
    if (!dt) return '—';

    const d = new Date(dt);

    return isNaN(d.getTime())
      ? String(dt)
      : d.toLocaleString('fr-FR');
  }

  private fmtNumber(val: any): string {
    return Number(val ?? 0).toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  private async loadImageAsDataURL(path: string): Promise<string> {
    const res = await fetch(path);
    const blob = await res.blob();

    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject('Erreur chargement image');

      reader.readAsDataURL(blob);
    });
  }
}
