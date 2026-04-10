import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TarifReglesComponent } from './tarif-regles.component';

describe('TarifReglesComponent', () => {
  let component: TarifReglesComponent;
  let fixture: ComponentFixture<TarifReglesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarifReglesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TarifReglesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
