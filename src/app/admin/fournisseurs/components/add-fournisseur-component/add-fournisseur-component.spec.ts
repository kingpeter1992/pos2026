import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddFournisseurComponent } from './add-fournisseur-component';

describe('AddFournisseurComponent', () => {
  let component: AddFournisseurComponent;
  let fixture: ComponentFixture<AddFournisseurComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddFournisseurComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddFournisseurComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
