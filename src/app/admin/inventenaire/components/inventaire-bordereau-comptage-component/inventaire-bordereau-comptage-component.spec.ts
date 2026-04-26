import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventaireBordereauComptageComponent } from './inventaire-bordereau-comptage-component';

describe('InventaireBordereauComptageComponent', () => {
  let component: InventaireBordereauComptageComponent;
  let fixture: ComponentFixture<InventaireBordereauComptageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventaireBordereauComptageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventaireBordereauComptageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
