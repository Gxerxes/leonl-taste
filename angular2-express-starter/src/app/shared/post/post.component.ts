import { Component, OnInit } from '@angular/core';
import { Subject, Observable } from 'rxjs';

import { Post } from './shared/post.model';
import { PostService } from './shared/post.service';

import { Movie } from './shared/data';
import { MovieService } from './shared/movie.service';

@Component({
	selector: 'post-search-list',
	templateUrl: 'post.component.html',
	providers: [MovieService]
})

export class PostComponent implements OnInit {
	total$: Observable<number>;
	items$: Observable<Movie[]>;

	terms: string = '';
	private searchTermStream = new Subject<string>();

	page: number = 1;
	private pageStream = new Subject<number>();

	constructor(private movieService: MovieService) { }

	ngOnInit() {
		const searchSource = this.searchTermStream
			.debounceTime(1000)
			.distinctUntilChanged()
			.map(searchTerm => {
				this.terms = searchTerm;
				return {search: searchTerm, page: 1}
			});

		const pageSource = this.pageStream.map(pageNumber => {
			this.page = pageNumber;
			return {search: this.terms, page: pageNumber}
		});

		const source = pageSource
			.merge(searchSource)
			.startWith({search: this.terms, page: this.page})
			.switchMap((params: {search: string, page: number}) => {
				return this.movieService.list(params.search, params.page)
			})
			.share();

		this.total$ = source.pluck('total') as any;
		this.items$ = source.pluck('items') as any;
	}

	search(terms: string) {
		this.searchTermStream.next(terms);
	}

	goToPage(page: number) {
		this.pageStream.next(page);
	}
}