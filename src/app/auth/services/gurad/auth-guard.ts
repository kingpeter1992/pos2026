import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { StorageService } from '../storage/storage-service';
import { ToastrService } from 'ngx-toastr';



@Injectable({
  providedIn: 'root'
})

export class authGuard implements CanActivate {

  constructor(private route: Router,
              private token: StorageService,
              private mss:ToastrService
            ){}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot):
    Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

      let  auth = this.token.isLoggedIn()
    console.log('AUTH:', auth);
      if (auth) {
        return true;
      }

      this.mss.info('Vous n\'avait pas d\'autorisation')
      return this.route.createUrlTree(['/login']);
  }

};



