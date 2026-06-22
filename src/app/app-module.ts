import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';

import { HeaderComponent }    from './components/header/header.component';
import { SidebarComponent }   from './components/sidebar/sidebar.component';
import { MapViewComponent }   from './components/map-view/map-view.component';
import { ListViewComponent }  from './components/list-view/list-view.component';
import { StatusBarComponent } from './components/status-bar/status-bar.component';

import { MagnitudeClassPipe } from './pipes/magnitude-class.pipe';
import { TimeAgoPipe }        from './pipes/time-ago.pipe';

@NgModule({
  declarations: [
    App,
    HeaderComponent,
    SidebarComponent,
    MapViewComponent,
    ListViewComponent,
    StatusBarComponent,
    MagnitudeClassPipe,
    TimeAgoPipe,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    AppRoutingModule,
    ScrollingModule,
  ],
  providers: [
    provideBrowserGlobalErrorListeners(),
    DatePipe,
  ],
  bootstrap: [App]
})
export class AppModule { }
