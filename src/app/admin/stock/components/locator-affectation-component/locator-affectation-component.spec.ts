import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocatorAffectationComponent } from './locator-affectation-component';

describe('LocatorAffectationComponent', () => {
  let component: LocatorAffectationComponent;
  let fixture: ComponentFixture<LocatorAffectationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocatorAffectationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LocatorAffectationComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
