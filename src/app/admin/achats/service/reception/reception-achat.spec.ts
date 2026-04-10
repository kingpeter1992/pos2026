import { TestBed } from '@angular/core/testing';

import { ReceptionAchat } from './reception-achat';

describe('ReceptionAchat', () => {
  let service: ReceptionAchat;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReceptionAchat);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
