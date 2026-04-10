import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dialogconfirm } from './dialogconfirm';

describe('Dialogconfirm', () => {
  let component: Dialogconfirm;
  let fixture: ComponentFixture<Dialogconfirm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dialogconfirm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dialogconfirm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
