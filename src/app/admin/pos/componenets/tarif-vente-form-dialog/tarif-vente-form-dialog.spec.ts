import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TarifVenteFormDialog } from './tarif-vente-form-dialog';

describe('TarifVenteFormDialog', () => {
  let component: TarifVenteFormDialog;
  let fixture: ComponentFixture<TarifVenteFormDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarifVenteFormDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TarifVenteFormDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
