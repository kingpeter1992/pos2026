import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FournisseursDashboardComponent } from './fournisseurs-dashboard-component';

describe('FournisseursDashboardComponent', () => {
  let component: FournisseursDashboardComponent;
  let fixture: ComponentFixture<FournisseursDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FournisseursDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FournisseursDashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
