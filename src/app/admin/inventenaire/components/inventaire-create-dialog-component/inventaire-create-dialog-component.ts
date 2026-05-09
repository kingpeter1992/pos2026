import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { DepotService } from '../../../stock/service/stock-service/depot.service';
import { TypeInventaire, InventaireCreateRequest } from '../../model/inventaire.models';
import { InventaireStoreService } from '../../service/inventaire-service/inventaire-store.service';
import { LocatorService } from '../../service/locator/locator-service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-inventaire-create-dialog-component',
  templateUrl: './inventaire-create-dialog-component.html',
  styleUrl: './inventaire-create-dialog-component.css',
  standalone:false,
  changeDetection: ChangeDetectionStrategy.OnPush

})
export class InventaireCreateDialogComponent implements OnInit {
 private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<InventaireCreateDialogComponent>);
  private readonly store = inject(InventaireStoreService);
  private readonly toastr = inject(ToastrService);
  private readonly depotService = inject(DepotService);
  private readonly locatorService = inject(LocatorService);

  readonly types: TypeInventaire[] = ['GLOBAL', 'TOURNANT', 'CIBLE'];

  depots: any[] = [];
  locators: any[] = [];
  loadingLocators = false;
  submitting = false;

  readonly form = this.fb.group({
    type: ['GLOBAL' as TypeInventaire, Validators.required],
    depotId: [null as number | null, Validators.required],
    locatorId: [{ value: null as number | null, disabled: true }],
    dateInventaire: [this.todayDateString(), Validators.required],
    commentaire: [''],
    memorise: [true],
    gelStockTheorique: [true],
    creePar: ['ADMIN']
  });

  ngOnInit(): void {
    this.loadDepots();
    this.initTypeBehavior();
    this.initDepotBehavior();
  }

  close(): void {
    this.dialogRef.close(false);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.error('Veuillez remplir les champs obligatoires.');
      return;
    }

    const value = this.form.getRawValue();
    const type = value.type!;

    const request: InventaireCreateRequest = {
      type,
      depotId: Number(value.depotId),
      locatorId: type === 'CIBLE' && value.locatorId ? Number(value.locatorId) : null,
      dateInventaire: value.dateInventaire || null,
      commentaire: value.commentaire || null,
      memorise: !!value.memorise,
      gelStockTheorique: !!value.gelStockTheorique,
      creePar: value.creePar || 'ADMIN'
    };

    this.submitting = true;

    this.store.createInventaire(request, {
      next: () => {
        this.submitting = false;
        this.toastr.success('Inventaire créé avec succès.');
        this.dialogRef.close(true);
      },
      error: (message) => {
        this.submitting = false;
        this.toastr.error(message);
      }
    });
  }

  private initTypeBehavior(): void {
    const typeControl = this.form.get('type');
    const locatorControl = this.form.get('locatorId');

    const applyTypeRules = (type: TypeInventaire | null) => {
      const isCible = type === 'CIBLE';
      const depotId = this.form.get('depotId')?.value;

      locatorControl?.patchValue(null, { emitEvent: false });

      if (isCible && depotId) {
        locatorControl?.enable({ emitEvent: false });
      } else {
        locatorControl?.disable({ emitEvent: false });
      }
    };

    applyTypeRules(typeControl?.value ?? 'GLOBAL');

    typeControl?.valueChanges.subscribe((type) => {
      applyTypeRules(type);

      if (type !== 'CIBLE') {
        this.locators = [];
      } else {
        const depotId = this.form.get('depotId')?.value;
        if (depotId) {
          this.loadLocators(Number(depotId));
        }
      }
    });
  }

  private initDepotBehavior(): void {
    this.form.get('depotId')?.valueChanges.subscribe((depotId) => {
      this.form.patchValue({ locatorId: null }, { emitEvent: false });
      this.locators = [];

      if (!depotId) {
        this.form.get('locatorId')?.disable({ emitEvent: false });
        return;
      }

      const type = this.form.get('type')?.value;
      if (type === 'CIBLE') {
        this.form.get('locatorId')?.enable({ emitEvent: false });
        this.loadLocators(Number(depotId));
      } else {
        this.form.get('locatorId')?.disable({ emitEvent: false });
      }
    });
  }

  private loadDepots(): void {
    this.depotService.getAll().subscribe({
      next: (data: any[]) => {
        this.depots = data ?? [];
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Erreur lors du chargement des dépôts.');
      }
    });
  }

  private loadLocators(depotId: number): void {
    if (!depotId) {
      this.locators = [];
      return;
    }

    this.loadingLocators = true;

    this.locatorService.findByDepot(depotId)
      .pipe(finalize(() => this.loadingLocators = false))
      .subscribe({
        next: (data: any[]) => {
          this.locators = data ?? [];
        },
        error: (err) => {
          console.error(err);
          this.locators = [];
          this.toastr.error('Erreur lors du chargement des locators.');
        }
      });
  }

  private todayDateString(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = `${now.getMonth() + 1}`.padStart(2, '0');
    const dd = `${now.getDate()}`.padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
