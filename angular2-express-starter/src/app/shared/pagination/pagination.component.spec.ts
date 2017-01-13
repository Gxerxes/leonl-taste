import { TestBed, inject } from '@angular/core/testing';

import { PaginationComponent } from './pagination.component';

describe('a pagination component', () => {
	let component: PaginationComponent;

	// register all needed dependencies
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				PaginationComponent
			]
		});
	});

	// instantiation through framework injection
	beforeEach(inject([PaginationComponent], (PaginationComponent) => {
		component = PaginationComponent;
	}));

	it('should have an instance', () => {
		expect(component).toBeDefined();
	});
});