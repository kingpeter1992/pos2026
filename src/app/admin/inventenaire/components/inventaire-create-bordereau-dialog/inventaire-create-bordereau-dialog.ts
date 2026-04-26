import { ChangeDetectionStrategy, Component, inject, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { InventaireBordereauStoreService } from '../../service/bordereau/inventaire-bordereau-store.service';



export interface GenererBordereauxDialogData {
  inventaireId: number;
}

@Component({
  selector: 'app-inventaire-create-bordereau-dialog',
  templateUrl: './inventaire-create-bordereau-dialog.html',
  styleUrl: './inventaire-create-bordereau-dialog.css',
  standalone: false,
      changeDetection: ChangeDetectionStrategy.OnPush
})

export class InventaireCreateBordereauDialog  implements OnInit {
 private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<InventaireCreateBordereauDialog>);
  readonly store = inject(InventaireBordereauStoreService);

  readonly form = this.fb.group({
    tailleBordereau: [50, [Validators.required, Validators.min(1)]],
    afficherQuantiteTheorique: [true],
    creePar: ['ADMIN POS']
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: GenererBordereauxDialogData) {}
  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }

  close(): void {
    this.dialogRef.close(false);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    this.store.genererBordereaux(this.data.inventaireId, {
      tailleBordereau: Number(raw.tailleBordereau),
      afficherQuantiteTheorique: !!raw.afficherQuantiteTheorique,
      creePar: raw.creePar || 'ADMIN POS'
    }, {
      next: (rows) => this.dialogRef.close(rows)
    });
  }}
