import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmAnnulationVenteDialogComponent } from './confirm-annulation-vente-dialog-component';

describe('ConfirmAnnulationVenteDialogComponent', () => {
  let component: ConfirmAnnulationVenteDialogComponent;
  let fixture: ComponentFixture<ConfirmAnnulationVenteDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmAnnulationVenteDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfirmAnnulationVenteDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
