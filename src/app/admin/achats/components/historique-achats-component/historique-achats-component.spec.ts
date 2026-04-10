import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoriqueAchatsComponent } from './historique-achats-component';

describe('HistoriqueAchatsComponent', () => {
  let component: HistoriqueAchatsComponent;
  let fixture: ComponentFixture<HistoriqueAchatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoriqueAchatsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoriqueAchatsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
