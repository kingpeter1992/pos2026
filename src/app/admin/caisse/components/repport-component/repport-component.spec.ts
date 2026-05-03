import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepportComponent } from './repport-component';

describe('RepportComponent', () => {
  let component: RepportComponent;
  let fixture: ComponentFixture<RepportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RepportComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
