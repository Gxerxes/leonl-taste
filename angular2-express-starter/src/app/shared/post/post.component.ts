import { Component, OnInit } from '@angular/core';

import { Post } from './shared/post.model';
import { PostService } from './shared/post.service';

@Component({
	selector: 'post',
	templateUrl: 'post.component.html',
	providers: [PostService]
})

export class PostComponent implements OnInit {
	post: Post[] = [];

	constructor(private postService: PostService) { }

	ngOnInit() {
		this.postService.getList().subscribe((res) => {
			this.post = res;
		});
	}
}