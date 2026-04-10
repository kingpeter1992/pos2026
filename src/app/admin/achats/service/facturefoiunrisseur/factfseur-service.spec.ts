import { TestBed } from '@angular/core/testing';

import { FactfseurService } from './factfseur-service';

describe('FactfseurService', () => {
  let service: FactfseurService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FactfseurService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
