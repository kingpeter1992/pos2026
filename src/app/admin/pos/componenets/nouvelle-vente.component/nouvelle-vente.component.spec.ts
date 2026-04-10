import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NouvelleVenteComponent } from './nouvelle-vente.component';

describe('NouvelleVenteComponent', () => {
  let component: NouvelleVenteComponent;
  let fixture: ComponentFixture<NouvelleVenteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NouvelleVenteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NouvelleVenteComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
