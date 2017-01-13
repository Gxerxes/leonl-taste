import { TestBed, inject } from '@angular/core/testing';
import { HttpModule } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/Rx';

import { PostComponent } from './post.component';
import { PostService } from './shared/post.service';
import { Post } from './shared/post.model';

describe('a post component', () => {
	let component: PostComponent;

	// register all needed dependencies
	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [HttpModule],
			providers: [
				{ provide: PostService, useClass: MockPostService },
				PostComponent
			]
		});
	});

	// instantiation through framework injection
	beforeEach(inject([PostComponent], (PostComponent) => {
		component = PostComponent;
	}));

	it('should have an instance', () => {
		expect(component).toBeDefined();
	});
});

// Mock of the original post service
class MockPostService extends PostService {
	getList(): Observable<any> {
		return Observable.from([ { id: 1, name: 'One'}, { id: 2, name: 'Two'} ]);
	}
}
