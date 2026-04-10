import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImagesProduitsComponent } from './images-produits-component';

describe('ImagesProduitsComponent', () => {
  let component: ImagesProduitsComponent;
  let fixture: ComponentFixture<ImagesProduitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImagesProduitsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImagesProduitsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
