import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FactureFournisseur } from './facture-fournisseur';

describe('FactureFournisseur', () => {
  let component: FactureFournisseur;
  let fixture: ComponentFixture<FactureFournisseur>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FactureFournisseur]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FactureFournisseur);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
