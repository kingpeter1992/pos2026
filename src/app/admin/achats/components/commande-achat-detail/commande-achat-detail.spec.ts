import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommandeAchatDetail } from './commande-achat-detail';

describe('CommandeAchatDetail', () => {
  let component: CommandeAchatDetail;
  let fixture: ComponentFixture<CommandeAchatDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommandeAchatDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommandeAchatDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
