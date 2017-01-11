import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute, 
    NavigationStart,
    NavigationEnd,
    NavigationCancel,
    RoutesRecognized,
    Event as NavigationEvent } from '@angular/router';

@Component({
    selector: 'app-navbar',
    templateUrl: 'navbar.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NavbarComponent {
    @Input() brand: string;

    constructor(private router: Router, private route: ActivatedRoute) {
        router.events.subscribe((event: NavigationEvent) => {
            console.log(event);

            // if (event instanceof NavigationStart) {
            //     // 
            // }
            switch (event.constructor) {
                case NavigationStart:
                    console.log('NavigationStart');
                    break;
                case NavigationCancel:
                    console.log('NavigationCancel');
                    break;
                case NavigationEnd:
                    console.log('NavigationEnd');
                    break;
                case RoutesRecognized:
                    console.log('RoutesRecognized');
                    break;
                default:
                    console.log('undefined');
                    break;
            }
        });
        // console.log(router);
        // console.log(router.url);
        // console.log(route);
    }
}
