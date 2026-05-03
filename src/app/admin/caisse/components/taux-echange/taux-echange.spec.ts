import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TauxEchange } from './taux-echange';

describe('TauxEchange', () => {
  let component: TauxEchange;
  let fixture: ComponentFixture<TauxEchange>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TauxEchange]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TauxEchange);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
