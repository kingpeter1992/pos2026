import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockActuelComponent } from './stock-actuel-component';

describe('StockActuelComponent', () => {
  let component: StockActuelComponent;
  let fixture: ComponentFixture<StockActuelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockActuelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StockActuelComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
