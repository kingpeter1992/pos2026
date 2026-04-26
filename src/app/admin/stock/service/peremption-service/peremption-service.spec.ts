import { TestBed } from '@angular/core/testing';

import { PeremptionService } from './peremption-service';

describe('PeremptionService', () => {
  let service: PeremptionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PeremptionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
