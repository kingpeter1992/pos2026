import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MouvementsStockComponent } from './mouvements-stock-component';

describe('MouvementsStockComponent', () => {
  let component: MouvementsStockComponent;
  let fixture: ComponentFixture<MouvementsStockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MouvementsStockComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MouvementsStockComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
