import { Component, OnInit }        from '@angular/core';
import { ActivatedRoute, Params }   from '@angular/router';
import { Location }                 from '@angular/common';

import { Hero }                     from '../models/hero';
import { HeroService }              from '../services/hero.service';
import { htmlTemplate }             from '../templates/hero-detail.html';

@Component({
    selector: 'my-hero-detail',
    styleUrls: ['dist/css/component/hero-detail.component.css'],
    template: htmlTemplate,
})

export class HeroDetailComponent implements OnInit {
    hero: Hero;
    error: any;

    constructor(
        private route: ActivatedRoute,
        private location: Location,
        private heroService: HeroService
    ) {}

    ngOnInit(): void {
        this.route.params.forEach((params: Params) => {
            let id = +params['id'];
            if (id) {
                this.heroService.getHero(id)
                    .subscribe(hero => this.hero = hero);
            } else {
                this.hero = new Hero();
            }
        });
    }

    save(): void {
        this.heroService
            .update(this.hero)
            .subscribe(
                hero => {
                    this.hero = hero; // saved hero, w/ id if new
                    this.goBack();
                },
                error => this.error = error  // TODO: Display error message
            );
    }

    goBack(): void {
        this.location.back();
    }

}
