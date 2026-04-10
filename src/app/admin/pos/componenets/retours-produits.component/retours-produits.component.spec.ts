import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RetoursProduitsComponent } from './retours-produits.component';

describe('RetoursProduitsComponent', () => {
  let component: RetoursProduitsComponent;
  let fixture: ComponentFixture<RetoursProduitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RetoursProduitsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RetoursProduitsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
