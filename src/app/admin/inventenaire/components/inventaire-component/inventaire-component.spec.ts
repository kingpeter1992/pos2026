import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventaireComponent } from './inventaire-component';

describe('InventaireComponent', () => {
  let component: InventaireComponent;
  let fixture: ComponentFixture<InventaireComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventaireComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventaireComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
