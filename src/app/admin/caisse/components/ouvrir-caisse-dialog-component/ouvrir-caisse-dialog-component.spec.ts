import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OuvrirCaisseDialogComponent } from './ouvrir-caisse-dialog-component';

describe('OuvrirCaisseDialogComponent', () => {
  let component: OuvrirCaisseDialogComponent;
  let fixture: ComponentFixture<OuvrirCaisseDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OuvrirCaisseDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OuvrirCaisseDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
