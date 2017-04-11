/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { HackerNewsApiService } from './hackernews-api.service';

describe('HackernewsApiService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HackerNewsApiService]
    });
  });

  it('should ...', inject([HackerNewsApiService], (service: HackerNewsApiService) => {
    expect(service).toBeTruthy();
  }));
});
