import { TestBed } from '@angular/core/testing';

import { VenteApiService } from './vente-api-service';

describe('VenteApiService', () => {
  let service: VenteApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VenteApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
