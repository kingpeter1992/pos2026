import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventaireVarianceResume } from './inventaire-variance-resume';

describe('InventaireVarianceResume', () => {
  let component: InventaireVarianceResume;
  let fixture: ComponentFixture<InventaireVarianceResume>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventaireVarianceResume]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventaireVarianceResume);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
