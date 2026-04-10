import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrevisionsAchatsComponent } from './previsions-achats-component';

describe('PrevisionsAchatsComponent', () => {
  let component: PrevisionsAchatsComponent;
  let fixture: ComponentFixture<PrevisionsAchatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PrevisionsAchatsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrevisionsAchatsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
