import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommandesFournisseursComponent } from './commandes-fournisseurs-component';

describe('CommandesFournisseursComponent', () => {
  let component: CommandesFournisseursComponent;
  let fixture: ComponentFixture<CommandesFournisseursComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommandesFournisseursComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommandesFournisseursComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
