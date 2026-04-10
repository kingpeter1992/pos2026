import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScanBarcodeComponent } from './scan-barcode-component';

describe('ScanBarcodeComponent', () => {
  let component: ScanBarcodeComponent;
  let fixture: ComponentFixture<ScanBarcodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScanBarcodeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScanBarcodeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
