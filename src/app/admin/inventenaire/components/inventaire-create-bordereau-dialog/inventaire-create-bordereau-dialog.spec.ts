import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventaireCreateBordereauDialog } from './inventaire-create-bordereau-dialog';

describe('InventaireCreateBordereauDialog', () => {
  let component: InventaireCreateBordereauDialog;
  let fixture: ComponentFixture<InventaireCreateBordereauDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventaireCreateBordereauDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventaireCreateBordereauDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
