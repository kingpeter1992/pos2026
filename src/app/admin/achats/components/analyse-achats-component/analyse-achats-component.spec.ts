import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalyseAchatsComponent } from './analyse-achats-component';

describe('AnalyseAchatsComponent', () => {
  let component: AnalyseAchatsComponent;
  let fixture: ComponentFixture<AnalyseAchatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalyseAchatsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnalyseAchatsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
