import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-ouvrir-caisse-dialog-component',
  templateUrl: './ouvrir-caisse-dialog-component.html',
  styleUrl: './ouvrir-caisse-dialog-component.css',
  standalone:false,
      changeDetection: ChangeDetectionStrategy.OnPush

})
export class OuvrirCaisseDialogComponent {

form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private ref: MatDialogRef<OuvrirCaisseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.form = this.fb.group({
      soldeInitialUSD: [0, [Validators.required, Validators.min(0)]],
      soldeInitialCDF: [0, [Validators.required, Validators.min(0)]],
      note: ['Ouverture de caisse']
    });
  }

  close(): void {
    this.ref.close();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = {
      soldeInitialUSD: Number(this.form.value.soldeInitialUSD ?? 0),
      soldeInitialCDF: Number(this.form.value.soldeInitialCDF ?? 0),
      note: (this.form.value.note ?? '').trim()
    };

    this.ref.close(payload);
  }
}
