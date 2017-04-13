import {
    TestBed
} from '@angular/core/testing';

import {
    FormGroup,
    ReactiveFormsModule
} from '@angular/forms';

import { DynamicFormComponent } from './dynamic-form.component';

describe('Component: DynamicFormComponent', () => {
    let component: DynamicFormComponent;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [DynamicFormComponent],
            imports: [ReactiveFormsModule]
        });

        const fixture = TestBed.createComponent(DynamicFormComponent);
        component = fixture.componentInstance;
    });

    it('should have a defined component', () => {
        expect(component).toBeDefined();
    });
});