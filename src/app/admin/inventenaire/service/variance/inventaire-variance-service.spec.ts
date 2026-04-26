import { TestBed } from '@angular/core/testing';

import { InventaireVarianceService } from './inventaire-variance-service';

describe('InventaireVarianceService', () => {
  let service: InventaireVarianceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InventaireVarianceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
