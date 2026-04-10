import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardPosComponent } from './dashboard-pos.component';

describe('DashboardPosComponent', () => {
  let component: DashboardPosComponent;
  let fixture: ComponentFixture<DashboardPosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardPosComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
