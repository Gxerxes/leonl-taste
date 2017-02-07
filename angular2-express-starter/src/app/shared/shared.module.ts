import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ModalComponent, ModalDirectives } from './modal/modal.component';
import { CommonModule } from '@angular/common';
import { JsonpModule } from '@angular/http';
import { TopNavigationComponent } from './top-navigation/top-navigation.component';
import { RouterModule } from '@angular/router';
import { SubNavigationComponent } from './sub-navigation/sub-navigation.component';
import { NotesComponent } from './notes/notes.component';
import { PaginationComponent } from './pagination/pagination.component';
import { PostComponent } from './post/post.component';

import { SlideAbleDirective } from './directives/ng2-slideable-directive';
import { Ng2StyledDirective } from './directives/ng2-styled.directive';
import { Ng2SliderComponent } from './ng2-slider/ng2-slider.component';

import { Slider } from './slider/slider.component';
import { WikipediaSearchComponent } from './wikipedia/wikipedia.component';

@NgModule({
  declarations: [
    ModalComponent,
    TopNavigationComponent,
    SubNavigationComponent,
    ModalDirectives,
    NotesComponent,
    PaginationComponent,
    PostComponent,
    Slider,
    WikipediaSearchComponent
    // SlideAbleDirective,
    // Ng2StyledDirective,
    // Ng2SliderComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    JsonpModule
  ],
  exports: [
    ModalComponent,
    ModalDirectives,
    TopNavigationComponent,
    SubNavigationComponent,
    NotesComponent,
    PaginationComponent,
    PostComponent,
    Slider,
    WikipediaSearchComponent
    // SlideAbleDirective,
    // Ng2StyledDirective,
    // Ng2SliderComponent
  ]
})
export class SharedModule {}
