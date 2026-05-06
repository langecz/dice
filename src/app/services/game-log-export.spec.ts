import { TestBed } from '@angular/core/testing';

import { GameLogExportService } from './game-log-export';

describe('GameLogExportService', () => {
  let service: GameLogExportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameLogExportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
