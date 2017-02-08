import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs/Observable';

import { WikipediaService } from './wikipedia.service';
import { ComponentsHelper } from './components-helper.service';

@Component({
  selector: 'wikipedia-search',
  template: `
    <div>
      <h2>Wikipedia Search</h2>
      <input type="text" [formControl]="term">
      <button (click)='div()'>div</button>
      <button (click)='getDocument()'>Get document</button>
      <button (click)='getRoot()'>Get root</button>
      <ul>
        <li *ngFor="let item of items | async">{{item}}</li>
      </ul>
    </div> 
  `,
  providers: [WikipediaService]
})
export class WikipediaSearchComponent implements OnInit {

  items: Observable<Array<string>>;
  term = new FormControl();

  constructor(private wikipediaService: WikipediaService) {}

  ngOnInit() {
    this.items = this.wikipediaService.search(this.term.valueChanges);
  }

  div() {
    let element = document.createElement('div');
    element.style.zIndex = '10000';
    element.style.position = 'absolute';
    element.style.bottom = '0';
    element.style.right = '0';
    element.style.cssFloat = 'left';
    element.style.width = '200px';
    element.style.height = '200px';
    element.style.backgroundColor = 'red';
    
    document.body.appendChild(element);
  }

  getDocument() {
    // let doc = this.componentsHelper.getDocument();
    // console.log(doc);
    // return doc;
  }

  getRoot() {
    // let root = this.componentsHelper.getRootViewContainerRef();
    // console.log(root);
    // return root;
  }

}