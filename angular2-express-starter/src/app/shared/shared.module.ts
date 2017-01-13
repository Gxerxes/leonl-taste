import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ModalComponent, ModalDirectives } from './modal/modal.component';
import { CommonModule } from '@angular/common';
import { TopNavigationComponent } from './top-navigation/top-navigation.component';
import { RouterModule } from '@angular/router';
import { SubNavigationComponent } from './sub-navigation/sub-navigation.component';
import { NotesComponent } from './notes/notes.component';
import { PaginationComponent } from './pagination/pagination.component';
import { PostComponent } from './post/post.component';

@NgModule({
  declarations: [
    ModalComponent,
    TopNavigationComponent,
    SubNavigationComponent,
    ModalDirectives,
    NotesComponent,
    PaginationComponent,
    PostComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    ModalComponent,
    ModalDirectives,
    TopNavigationComponent,
    SubNavigationComponent,
    NotesComponent,
    PaginationComponent,
    PostComponent
  ]
})
export class SharedModule {}
