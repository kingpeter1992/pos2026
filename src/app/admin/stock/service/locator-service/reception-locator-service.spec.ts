import { TestBed } from '@angular/core/testing';

import { ReceptionLocatorService } from './reception-locator-service';

describe('ReceptionLocatorService', () => {
  let service: ReceptionLocatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReceptionLocatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
