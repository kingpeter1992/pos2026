import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TarifRegleFormDialog } from './tarif-regle-form-dialog';

describe('TarifRegleFormDialog', () => {
  let component: TarifRegleFormDialog;
  let fixture: ComponentFixture<TarifRegleFormDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarifRegleFormDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TarifRegleFormDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
