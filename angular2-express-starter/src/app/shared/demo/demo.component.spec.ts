import { TestBed, inject } from '@angular/core/testing';

import { DemoComponent } from './demo.component';

describe('a demo component', () => {
	let component: DemoComponent;

	// register all needed dependencies
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				DemoComponent
			]
		});
	});

	// instantiation through framework injection
	beforeEach(inject([DemoComponent], (DemoComponent) => {
		component = DemoComponent;
	}));

	it('should have an instance', () => {
		expect(component).toBeDefined();
	});
});