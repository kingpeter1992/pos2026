import { TestBed } from '@angular/core/testing';

import { CommandeAchat } from './commande-achat';

describe('CommandeAchat', () => {
  let service: CommandeAchat;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommandeAchat);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
