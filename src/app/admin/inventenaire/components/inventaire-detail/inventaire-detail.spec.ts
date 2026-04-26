import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventaireDetail } from './inventaire-detail';

describe('InventaireDetail', () => {
  let component: InventaireDetail;
  let fixture: ComponentFixture<InventaireDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventaireDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventaireDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
