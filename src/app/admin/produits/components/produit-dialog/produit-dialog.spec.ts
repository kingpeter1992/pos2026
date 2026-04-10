import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProduitDialog } from './produit-dialog';

describe('ProduitDialog', () => {
  let component: ProduitDialog;
  let fixture: ComponentFixture<ProduitDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProduitDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProduitDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
