import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventaireCreateDialogComponent } from './inventaire-create-dialog-component';

describe('InventaireCreateDialogComponent', () => {
  let component: InventaireCreateDialogComponent;
  let fixture: ComponentFixture<InventaireCreateDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventaireCreateDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventaireCreateDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
