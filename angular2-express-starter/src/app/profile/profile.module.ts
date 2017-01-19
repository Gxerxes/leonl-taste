import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ProfileComponent } from './profile.component';
import { CommonModule } from '@angular/common';
import { routing } from './profile.routing';
import { EditComponent } from './edit/edit.component';
import { SharedModule } from '../shared/shared.module';

import { Slider } from '../shared/slider/slider.component';

@NgModule({
  imports: [
    CommonModule,
    routing,
    SharedModule,
    FormsModule
  ],
  declarations: [
    ProfileComponent,
    EditComponent
  ],
  bootstrap: [
    ProfileComponent
  ]
})
export class ProfileModule {}
