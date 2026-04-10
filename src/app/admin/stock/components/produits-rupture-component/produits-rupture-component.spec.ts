import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProduitsRuptureComponent } from './produits-rupture-component';

describe('ProduitsRuptureComponent', () => {
  let component: ProduitsRuptureComponent;
  let fixture: ComponentFixture<ProduitsRuptureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProduitsRuptureComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProduitsRuptureComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
