import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProduitPickerDialogComponent } from './produit-picker-dialog-component';

describe('ProduitPickerDialogComponent', () => {
  let component: ProduitPickerDialogComponent;
  let fixture: ComponentFixture<ProduitPickerDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProduitPickerDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProduitPickerDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
