import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockFaibleComponent } from './stock-faible-component';

describe('StockFaibleComponent', () => {
  let component: StockFaibleComponent;
  let fixture: ComponentFixture<StockFaibleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockFaibleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StockFaibleComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
