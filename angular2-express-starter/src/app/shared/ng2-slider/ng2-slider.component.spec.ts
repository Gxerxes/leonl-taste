import { TestBed, inject } from '@angular/core/testing';

import { Ng2SliderComponent } from './ng2-slider.component';

describe('a ng2-slider component', () => {
	let component: Ng2SliderComponent;

	// register all needed dependencies
	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				Ng2SliderComponent
			]
		});
	});

	// instantiation through framework injection
	beforeEach(inject([Ng2SliderComponent], (Ng2SliderComponent) => {
		component = Ng2SliderComponent;
	}));

	it('should have an instance', () => {
		expect(component).toBeDefined();
	});
});