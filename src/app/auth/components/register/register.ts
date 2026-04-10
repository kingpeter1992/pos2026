import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { LoaderService } from '../../../shares/services/loader/loader-service';
import { AuthService } from '../../services/auth/auth-service';
import { Toast } from '../../../shares/services/toast/toast';

@Component({
  selector: 'app-register',
  templateUrl: './register.html',
  styleUrl: './register.css',
  standalone: false
})
export class Register implements OnInit{
  loading$: Observable<boolean> | undefined;

  form: any = {
    username: null,
    email: null,
    password: null,
    cpassword: null
  };
   isSuccessful = false;
   isSignUpFailed = false;
   errorMessage = '';
    alerts: any;

  constructor(private fb:FormBuilder,
    private loadingService: LoaderService,
    private _dao:AuthService,
    private toast:Toast,
     private route:Router){
   //   this.loading$ = this.loadingService.loading$;
    }
  ngOnInit(): void {
  }



  onSubmit(): void {

    this.loadingService.show();
     this.checkMAtchPassword(this.form.password, this.form.cpassword);

    const { username, email, password } = this.form;
   // console.log(this.form)
    if (this.form.invalid) {
      return;
    }
    this._dao.register(username, email, password).subscribe({
      next: data => {
        this.isSuccessful = true;
        this.isSignUpFailed = false;
//        alert('Success')
        this.toast.success("Compte créer, `\contacter l'admin")
        this.route.navigateByUrl("/")
      },
      error: err => {
        this.errorMessage = err.error.message;
          console.log('Erreur reçue :', err); // 👈 Ajoute ceci

        this.isSignUpFailed = true;
        alert( `${this.errorMessage}`)

      }
    });

  }
  checkMAtchPassword(password: any, cpassword: any) {
    if (password !== cpassword) {
      alert('Password and Confirmation Password do not match');
      this.loadingService.hide();
      return false;
    }
    return true;
  }




}
