import { BrowserModule } from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { CookieService } from 'ngx-cookie-service';
import { MatInputModule, MatCardModule, MatIconModule, MatButtonModule, MatSelectModule, MatDialogModule } from '@angular/material';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { EmployeeComponent } from './employee/employee.component';
import { SecurityComponent, DialogOverviewExampleDialog } from './security/security.component';

import { MatDatepickerModule, MatMomentDateModule } from '@coachcare/datepicker';
import { NgxUiLoaderModule, NgxUiLoaderConfig, SPINNER, POSITION, PB_DIRECTION } from 'ngx-ui-loader';
import {WebcamModule} from 'ngx-webcam';

const ngxUiLoaderConfig: NgxUiLoaderConfig = {
  bgsType: SPINNER.threeStrings,
  pbDirection: PB_DIRECTION.leftToRight, // progress bar direction
  pbThickness: 4, // progress bar thickness
};

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    EmployeeComponent,
    SecurityComponent,
    DialogOverviewExampleDialog
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatInputModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatMomentDateModule,
    NgxUiLoaderModule.forRoot(ngxUiLoaderConfig),
    MatDialogModule,
    WebcamModule
  ],
  entryComponents: [ DialogOverviewExampleDialog],
  providers: [CookieService],
  bootstrap: [AppComponent]
})
export class AppModule { }
