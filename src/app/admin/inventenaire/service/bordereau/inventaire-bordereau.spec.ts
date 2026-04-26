import { TestBed } from '@angular/core/testing';

import { InventaireBordereau } from './inventaire-bordereau';

describe('InventaireBordereau', () => {
  let service: InventaireBordereau;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InventaireBordereau);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
