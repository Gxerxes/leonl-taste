import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { IAppState } from '../store/index';
import { Observable } from 'rxjs';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-profile',
  templateUrl: 'profile.component.html'
})
export class ProfileComponent implements OnInit {

  profile$: Observable<{}>;

  val1: number = 20;
  min: number = 0;
  max: number = 20;

  timeSub: Subscription;

  constructor(store: Store<IAppState>) {

    this.profile$ = store.select('profile');
  }

  ngOnInit() {
    let timer = Observable.timer(2000, 1000)
      .timeInterval()
      // .pluck('interval')
      .map(function(x) {
        console.log(x);
        return x.value;
      })
      .take(20);

    let timeSub = timer.subscribe(t => {
      this.val1 = t;
      console.log(this.val1);
    });

  }

  onBarClick(event: any) {
    console.log(event);
    this.val1 = event.value;
  }
}
