import { TestBed } from '@angular/core/testing';

import { TarifVenteService } from './tarif-vente.service';

describe('TarifVenteService', () => {
  let service: TarifVenteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TarifVenteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
