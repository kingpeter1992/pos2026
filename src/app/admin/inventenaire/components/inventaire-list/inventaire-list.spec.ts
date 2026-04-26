import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventaireList } from './inventaire-list';

describe('InventaireList', () => {
  let component: InventaireList;
  let fixture: ComponentFixture<InventaireList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventaireList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventaireList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
