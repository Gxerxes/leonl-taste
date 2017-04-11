import { Component, OnInit, Input } from '@angular/core';
import { HackerNewsApiService } from '../hackernews-api.service';

@Component({
  selector: 'item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.scss']
})
export class ItemComponent implements OnInit {

  @Input() item;

  constructor(private _hackerNewsAPIService: HackerNewsApiService) { }

  ngOnInit() {
    // this._hackerNewsAPIService.fetchItem(this.itemID).subscribe(data => {
    //   this.item = data;
    // }, error => console.log('Could not load item' + this.itemID));
  }

}
