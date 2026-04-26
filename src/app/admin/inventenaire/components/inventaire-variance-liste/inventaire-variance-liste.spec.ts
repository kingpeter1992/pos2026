import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventaireVarianceListe } from './inventaire-variance-liste';

describe('InventaireVarianceListe', () => {
  let component: InventaireVarianceListe;
  let fixture: ComponentFixture<InventaireVarianceListe>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventaireVarianceListe]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventaireVarianceListe);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
