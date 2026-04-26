import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventaireCardPrint } from './inventaire-card-print';

describe('InventaireCardPrint', () => {
  let component: InventaireCardPrint;
  let fixture: ComponentFixture<InventaireCardPrint>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventaireCardPrint]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventaireCardPrint);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
