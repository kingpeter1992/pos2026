import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayout } from '../admin/layout-component/admin-layout/admin-layout';
import { AdminUsersComponent } from './admin-users/admin-users.component';

const routes: Routes = [
  {
    path: '', component: AdminLayout,  children : [
    {path :'',  redirectTo: 'managementuser',  pathMatch:'full'},
  ]
 }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
