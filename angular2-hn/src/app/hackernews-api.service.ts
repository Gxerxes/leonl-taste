import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

@Injectable()
export class HackerNewsApiService {
  baseUrl: string;

  constructor(private http: Http) { 
    //this.baseUrl = 'https://hacker-news.firebaseio.com/v0';
    this.baseUrl = 'https://node-hnapi.herokuapp.com';
  }

  // fetchStories(): Observable<any> {
  //   return this.http.get(`${this.baseUrl}/topstories.json`)
  //                   .map(response => response.json());
  // }

  fetchStories(storyType: string, page: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${storyType}?page=${page}`)
                    .map(response => response.json());
  }

  fetchItem(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/item/${id}.json`)
                    .map(response => response.json());
  }

  fetchComments(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/item/${id}`)
                    .map(response => response.json());
  }
}
