import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaisseGraphDialogComponent } from './caisse-graph-dialog-component';

describe('CaisseGraphDialogComponent', () => {
  let component: CaisseGraphDialogComponent;
  let fixture: ComponentFixture<CaisseGraphDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaisseGraphDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CaisseGraphDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
