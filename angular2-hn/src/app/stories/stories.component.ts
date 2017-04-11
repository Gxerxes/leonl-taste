import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ActivatedRoute } from '@angular/router';
import { HackerNewsApiService } from '../hackernews-api.service';

@Component({
  selector: 'app-stories',
  templateUrl: './stories.component.html',
  styleUrls: ['./stories.component.scss']
})
export class StoriesComponent implements OnInit {
  typeSub: any;
  pageSub: any;
  items: number[];
  storiesType;
  pageNum: number;
  listStart: number;

  constructor(private _hackerNewsAPIService: HackerNewsApiService, private route: ActivatedRoute) { 
    //this.items = Array(30);
  }

  ngOnInit() {
    this.typeSub = this.route
      .data
      .subscribe(data => this.storiesType = (data as any).storiesType);

    this.pageSub = this.route.params.subscribe(params => {
      this.pageNum = +params['page'] ? + params['page'] : 1;

      this._hackerNewsAPIService.fetchStories(this.storiesType, this.pageNum)
                .subscribe(
                  items => this.items = items,
                  error => console.log('Error fetching' + this.storiesType + 'stories'),
                  () => {
                    this.listStart = ((this.pageNum - 1) * 30 + 1);
                  });

    });

    // this._hackerNewsAPIService.fetchStories('news', 1)
    //                 .subscribe(
    //                   items => this.items = items,
    //                   error => console.log('Error fetching stories')
    //                 );
  }

}
