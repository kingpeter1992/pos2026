import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdatuserComponent } from './updatuser.component';

describe('UpdatuserComponent', () => {
  let component: UpdatuserComponent;
  let fixture: ComponentFixture<UpdatuserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UpdatuserComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UpdatuserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
