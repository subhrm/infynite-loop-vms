import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { EmployeeComponent } from './employee/employee.component';
import { SecurityComponent } from './security/security.component';

const routes: Routes = [
  {path: 'login', component: LoginComponent},
  {path: 'employee', component: EmployeeComponent},
  {path: 'security', component: SecurityComponent},
  { path: '', redirectTo: '/login', pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
