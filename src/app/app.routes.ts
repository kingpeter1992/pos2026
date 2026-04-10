import { NgModule } from '@angular/core';

import { RouterModule, Routes } from '@angular/router';
import { NotFound } from './auth/components/not-found/not-found';
import { authGuard } from './auth/services/gurad/auth-guard';
import { ForgotPassword } from './auth/components/forgot-password/forgot-password';
import { Login } from './auth/components/login/login';
import { Register } from './auth/components/register/register';
import { RenitializPassword } from './auth/components/renitializ-password/renitializ-password';
import { PasswordforgotComponent } from './user/passwordforgot/passwordforgot.component';
import { RenitialisationpasswordComponent } from './user/renitialisationpassword/renitialisationpassword.component';


export const routes: Routes = [
  {

    path: 'admin',
    loadChildren: () =>
      import('./admin/admin-module').then(m => m.AdminModule),
    canActivate: [authGuard]
  },
/*   {
    path: 'admin',
    loadChildren: () =>
      import('./user/user-module').then(m => m.UserModule),
    canActivate: [authGuard]
  }, */
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'singup', component: Register },
  { path: 'forgarpaaword', component: PasswordforgotComponent },
  { path: 'reset-password', component: RenitialisationpasswordComponent },
  { path: '**', component: NotFound }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
