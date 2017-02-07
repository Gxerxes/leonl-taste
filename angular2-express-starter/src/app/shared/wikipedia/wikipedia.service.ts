import { Injectable } from '@angular/core';
import { URLSearchParams, Jsonp } from '@angular/http';

import { Observable } from 'rxjs/Observable'

@Injectable()
export class WikipediaService {

    constructor(private jsonp: Jsonp) {}

    search(terms: Observable<string>, debounceDuration = 400) {
        return terms.debounceTime(debounceDuration)
                    .distinctUntilChanged()
                    .switchMap(term => this.rawSearch(term));
    }

    rawSearch (term: string) {
        let params = new URLSearchParams();
        params.set('action', 'opensearch');
        params.set('search', term);
        params.set('format', 'json');
        console.log(params);
        return this.jsonp
                    .get('http://en.wikipedia.org/w/api.php?callback=JSONP_CALLBACK', {search: params})
                    .map((response) => response.json()[1]);
    }


}