import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Toast } from '../../shares/services/toast/toast';
import { AuthService } from '../../auth/services/auth/auth-service';
import { LoaderService } from '../../shares/services/loader/loader-service';



@Component({
  selector: 'app-passwordforgot',
  templateUrl: './passwordforgot.component.html',
  styleUrl: './passwordforgot.component.scss',
  standalone:false
})
export class PasswordforgotComponent {

    loading$: Observable<boolean> | undefined;


   constructor(
    private toastrService:Toast,
    private _dao:AuthService,
        private loadingService: LoaderService,

    private route:Router){
     this.loading$ = this.loadingService.loading$;
    }

email = '';


  onSubmit() {
    this._dao.forgotPassword(this.email).subscribe(() => {
    //  alert('Si l’email existe, un lien a été envoyé.');
      this.toastrService.success('Si l’email existe, un lien a été envoyé, Réinitialisation du mot de passe');
    });
  }

}
