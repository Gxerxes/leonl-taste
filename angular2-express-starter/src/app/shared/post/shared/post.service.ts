import { Injectable } from '@angular/core';
import { Http, URLSearchParams } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { Post } from './post.model';
import { ListResult } from './list-result.interface';

@Injectable()
export class PostService {

	constructor(private http: Http) { }

	getList(): Observable<Post[]> {
		return this.http.get('/api/list').map(res => res.json() as Post[]);
	}

	list(search: string = null, page = 1, limit = 10): Observable<ListResult<Post>> {
		let params = new URLSearchParams();
		if (search) {
			params.set('search', search);
		}
		if (page) {
			params.set('search', String(page));
		}
		if (limit) {
			params.set('search', String(limit));
		}
		return this.http.get('http://myapidomain.com/post', {search: params }).map(res => res.json());
	}
}