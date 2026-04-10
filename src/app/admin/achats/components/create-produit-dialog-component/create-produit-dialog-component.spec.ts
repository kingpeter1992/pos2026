import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateProduitDialogComponent } from './create-produit-dialog-component';

describe('CreateProduitDialogComponent', () => {
  let component: CreateProduitDialogComponent;
  let fixture: ComponentFixture<CreateProduitDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateProduitDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateProduitDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
