import { TestBed } from '@angular/core/testing';

import { ServiceInventaire } from './service-inventaire';

describe('ServiceInventaire', () => {
  let service: ServiceInventaire;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiceInventaire);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
