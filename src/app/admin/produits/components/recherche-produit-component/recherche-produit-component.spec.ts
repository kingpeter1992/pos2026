import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RechercheProduitComponent } from './recherche-produit-component';

describe('RechercheProduitComponent', () => {
  let component: RechercheProduitComponent;
  let fixture: ComponentFixture<RechercheProduitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RechercheProduitComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RechercheProduitComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
