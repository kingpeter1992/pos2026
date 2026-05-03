import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CloturerCaisseDialogComponent } from './cloturer-caisse-dialog-component';

describe('CloturerCaisseDialogComponent', () => {
  let component: CloturerCaisseDialogComponent;
  let fixture: ComponentFixture<CloturerCaisseDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CloturerCaisseDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CloturerCaisseDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
