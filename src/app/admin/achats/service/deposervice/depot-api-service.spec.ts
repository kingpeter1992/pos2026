import { TestBed } from '@angular/core/testing';

import { DepotApiService } from './depot-api-service';

describe('DepotApiService', () => {
  let service: DepotApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DepotApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
