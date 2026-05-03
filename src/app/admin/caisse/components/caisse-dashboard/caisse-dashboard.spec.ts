import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaisseDashboard } from './caisse-dashboard';

describe('CaisseDashboard', () => {
  let component: CaisseDashboard;
  let fixture: ComponentFixture<CaisseDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaisseDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CaisseDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
