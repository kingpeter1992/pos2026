import { TestBed } from '@angular/core/testing';

import { ImageOptimizer } from './image-optimizer';

describe('ImageOptimizer', () => {
  let service: ImageOptimizer;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ImageOptimizer);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
