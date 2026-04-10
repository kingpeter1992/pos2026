import { TestBed } from '@angular/core/testing';

import { MouvementStockService } from './mouvement-stock-service';

describe('MouvementStockService', () => {
  let service: MouvementStockService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MouvementStockService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
