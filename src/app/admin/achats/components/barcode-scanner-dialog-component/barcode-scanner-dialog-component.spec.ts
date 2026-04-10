import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BarcodeScannerDialogComponent } from './barcode-scanner-dialog-component';

describe('BarcodeScannerDialogComponent', () => {
  let component: BarcodeScannerDialogComponent;
  let fixture: ComponentFixture<BarcodeScannerDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarcodeScannerDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BarcodeScannerDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
