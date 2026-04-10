import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AchatsDashboardComponent } from './achats-dashboard-component';

describe('AchatsDashboardComponent', () => {
  let component: AchatsDashboardComponent;
  let fixture: ComponentFixture<AchatsDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AchatsDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AchatsDashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
