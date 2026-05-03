import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { CaisseSessionDto } from '../../models/caisse.model';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-cloturer-caisse-dialog-component',
  templateUrl: './cloturer-caisse-dialog-component.html',
  styleUrl: './cloturer-caisse-dialog-component.css',
  standalone:false,
  changeDetection: ChangeDetectionStrategy.OnPush

})
export class CloturerCaisseDialogComponent {
 session: CaisseSessionDto | null = null;
   form!: FormGroup;



  constructor(
    private fb: FormBuilder,
    private ref: MatDialogRef<CloturerCaisseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { session: CaisseSessionDto }
  ) {
    this.session = data?.session ?? null;
      this.form = this.fb.group({
    note: ['Clôture de caisse']
  });

  }

  close(): void { this.ref.close(); }
  submit(): void { this.ref.close(this.form.value); }
}
