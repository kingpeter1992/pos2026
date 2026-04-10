import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommandeAchatList } from './commande-achat-list';

describe('CommandeAchatList', () => {
  let component: CommandeAchatList;
  let fixture: ComponentFixture<CommandeAchatList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommandeAchatList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommandeAchatList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
