import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TarifVenteComponent } from './tarif-vente-component';

describe('TarifVenteComponent', () => {
  let component: TarifVenteComponent;
  let fixture: ComponentFixture<TarifVenteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarifVenteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TarifVenteComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
