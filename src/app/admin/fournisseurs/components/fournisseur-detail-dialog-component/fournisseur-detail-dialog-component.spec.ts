import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FournisseurDetailDialogComponent } from './fournisseur-detail-dialog-component';

describe('FournisseurDetailDialogComponent', () => {
  let component: FournisseurDetailDialogComponent;
  let fixture: ComponentFixture<FournisseurDetailDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FournisseurDetailDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FournisseurDetailDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
