import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';

const appRoutes: Routes = [
    {
        path: 'todolist',
        loadChildren: 'app/todolist/todolist.module#TodolistModule'
    },
    {
        path: 'myapp',
        loadChildren: 'app/myapp/myapp.module#MyAppModule'
    }
];

@NgModule({
    imports: [
        RouterModule.forRoot(appRoutes, {
            preloadingStrategy: PreloadAllModules
        })
    ],
    exports: [
        RouterModule
    ],
    providers: []
})
export class AppRoutingModule {

}
