import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateProduitComponent } from './create-produit-component';

describe('CreateProduitComponent', () => {
  let component: CreateProduitComponent;
  let fixture: ComponentFixture<CreateProduitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateProduitComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateProduitComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
