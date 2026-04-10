import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategorieDialogComponent } from './categorie-dialog-component';

describe('CategorieDialogComponent', () => {
  let component: CategorieDialogComponent;
  let fixture: ComponentFixture<CategorieDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategorieDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CategorieDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
