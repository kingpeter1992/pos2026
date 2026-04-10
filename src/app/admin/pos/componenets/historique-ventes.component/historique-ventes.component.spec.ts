import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoriqueVentesComponent } from './historique-ventes.component';

describe('HistoriqueVentesComponent', () => {
  let component: HistoriqueVentesComponent;
  let fixture: ComponentFixture<HistoriqueVentesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoriqueVentesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoriqueVentesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
