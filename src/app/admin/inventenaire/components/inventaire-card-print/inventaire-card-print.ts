import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { InventaireResponse } from '../../model/inventaire.models';
import { InventaireBordereau, InventaireBordereauLigneResponse } from '../../model/inventaire-bordereau.models';

@Component({
  selector: 'app-inventaire-card-print',
  templateUrl: './inventaire-card-print.html',
  styleUrl: './inventaire-card-print.css',
  standalone: false,
    changeDetection: ChangeDetectionStrategy.OnPush

})
export class InventaireCardPrint {
  @Input({ required: true }) inventaire!: InventaireResponse;
  @Input({ required: true }) bordereau!: InventaireBordereau;
  @Input({ required: true }) lignes: InventaireBordereauLigneResponse[] = [];
    @Input() editable = false;


}
