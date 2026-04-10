import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuggestionsReapprovisionnementComponent } from './suggestions-reapprovisionnement-component';

describe('SuggestionsReapprovisionnementComponent', () => {
  let component: SuggestionsReapprovisionnementComponent;
  let fixture: ComponentFixture<SuggestionsReapprovisionnementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuggestionsReapprovisionnementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuggestionsReapprovisionnementComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
