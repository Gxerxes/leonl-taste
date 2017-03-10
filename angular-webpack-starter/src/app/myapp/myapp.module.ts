import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MyAppComponent } from './myapp.component';
import { MyAppRoutingModule } from './myapp-routing.module';
import { TooltipModule } from '../shared/tooltip/tooltip.module';

@NgModule({
    declarations: [
        MyAppComponent
    ],
    imports: [
        FormsModule,
        CommonModule,
        MyAppRoutingModule,
        TooltipModule
    ],
    exports: [
        MyAppComponent
    ]
})
export class MyAppModule {
}
