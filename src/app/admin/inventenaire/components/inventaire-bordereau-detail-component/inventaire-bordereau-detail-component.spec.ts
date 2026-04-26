import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventaireBordereauDetailComponent } from './inventaire-bordereau-detail-component';

describe('InventaireBordereauDetailComponent', () => {
  let component: InventaireBordereauDetailComponent;
  let fixture: ComponentFixture<InventaireBordereauDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventaireBordereauDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventaireBordereauDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
