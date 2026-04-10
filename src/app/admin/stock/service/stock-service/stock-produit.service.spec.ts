import { TestBed } from '@angular/core/testing';

import { StockProduitService } from './stock-produit.service';

describe('StockProduitService', () => {
  let service: StockProduitService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StockProduitService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
