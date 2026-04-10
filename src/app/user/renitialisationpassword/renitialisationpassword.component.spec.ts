import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RenitialisationpasswordComponent } from './renitialisationpassword.component';

describe('RenitialisationpasswordComponent', () => {
  let component: RenitialisationpasswordComponent;
  let fixture: ComponentFixture<RenitialisationpasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [RenitialisationpasswordComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RenitialisationpasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
