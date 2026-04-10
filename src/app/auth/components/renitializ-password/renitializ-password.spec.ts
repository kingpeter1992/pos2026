import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RenitializPassword } from './renitializ-password';

describe('RenitializPassword', () => {
  let component: RenitializPassword;
  let fixture: ComponentFixture<RenitializPassword>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RenitializPassword]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RenitializPassword);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
