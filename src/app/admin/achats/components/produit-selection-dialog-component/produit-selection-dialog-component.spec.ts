import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProduitSelectionDialogComponent } from './produit-selection-dialog-component';

describe('ProduitSelectionDialogComponent', () => {
  let component: ProduitSelectionDialogComponent;
  let fixture: ComponentFixture<ProduitSelectionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProduitSelectionDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProduitSelectionDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
