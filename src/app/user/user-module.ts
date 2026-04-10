import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Home } from './layout-component/home/home';
import { UserLayout } from './layout-component/user-layout/user-layout';
import { UserRoutingModule } from './user-routing-module';


@NgModule({
  declarations: [Home, UserLayout], // <- composants classiques
  imports: [
    CommonModule,
    UserRoutingModule
  ]
})
export class UserModule { }
