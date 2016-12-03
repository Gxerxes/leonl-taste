import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { AngularFireModule, AuthProviders, AuthMethods } from 'angularfire2';


export const firebaseConfig = {
    apiKey: "AIzaSyDeqkjWxz_8TRTEUahaSzAvTVpCzHekdHM",
    authDomain: "fir-demo-ff26e.firebaseapp.com",
    databaseURL: "https://fir-demo-ff26e.firebaseio.com",
    storageBucket: "fir-demo-ff26e.appspot.com",
    messagingSenderId: "217882760980"
};

export const firebaseAuthConfig = {
  provider: AuthProviders.Google,
  method: AuthMethods.Redirect
}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    AngularFireModule.initializeApp(firebaseConfig, firebaseAuthConfig)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
