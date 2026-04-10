import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProduitsFournisseursComponent } from './produits-fournisseurs-component';

describe('ProduitsFournisseursComponent', () => {
  let component: ProduitsFournisseursComponent;
  let fixture: ComponentFixture<ProduitsFournisseursComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProduitsFournisseursComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProduitsFournisseursComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
