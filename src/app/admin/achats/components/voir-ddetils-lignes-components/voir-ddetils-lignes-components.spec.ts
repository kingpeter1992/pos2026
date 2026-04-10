import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoirDdetilsLignesComponents } from './voir-ddetils-lignes-components';

describe('VoirDdetilsLignesComponents', () => {
  let component: VoirDdetilsLignesComponents;
  let fixture: ComponentFixture<VoirDdetilsLignesComponents>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoirDdetilsLignesComponents]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VoirDdetilsLignesComponents);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
