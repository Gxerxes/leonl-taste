import { Component } from '@angular/core';

import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-todolist',
    templateUrl: 'myapp.component.html',
    styleUrls: [
        'myapp.component.css'
    ]
})
export class MyAppComponent {

    constructor(router: Router, private location: Location, private route: ActivatedRoute) {
        location.subscribe(val => {
            console.log(val);
            // router.navigate(['/todolist']);
        });
        console.log(router.url);
        console.log(route);
    }

    private routeChanged(): void {
        let path: string = this.location.path();
        console.log('Path:' + path);
    }

}
