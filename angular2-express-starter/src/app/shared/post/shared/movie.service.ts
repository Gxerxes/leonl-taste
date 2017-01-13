import { Injectable } from '@angular/core';
import { Http, URLSearchParams } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { Post } from './post.model';
import { ListResult } from './list-result.interface';

import { Movie } from './data';
import { movieDb } from './data';

@Injectable()
export class MovieService {

    movies: Movie[] = movieDb;

    constructor() { }

	list(search: string = null, page = 1, limit = 10): Observable<ListResult<Movie>> {
        let movieResult = this.movies.filter(function(movie: Movie) {
            return (search) ? movie.title.toUpperCase().indexOf(search) !== -1 : true;
        });

        let movieResultPage = movieResult.slice((page - 1) * limit, page * limit);

        return Observable.of({total: movieResult.length, items: movieResultPage}).delay(100);
	}
}