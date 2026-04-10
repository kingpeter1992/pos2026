import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlertesStockComponent } from './alertes-stock-component';

describe('AlertesStockComponent', () => {
  let component: AlertesStockComponent;
  let fixture: ComponentFixture<AlertesStockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertesStockComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlertesStockComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
