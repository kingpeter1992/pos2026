import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/internal/Observable';
import { Router, ActivatedRoute } from '@angular/router';
import { LoaderService } from '../../shares/services/loader/loader-service';
import { Toast } from '../../shares/services/toast/toast';
import { AuthService } from '../../auth/services/auth/auth-service';

@Component({
  selector: 'app-renitialisationpassword',
  templateUrl: './renitialisationpassword.component.html',
  styleUrl: './renitialisationpassword.component.scss',
  standalone:false
})
export class RenitialisationpasswordComponent implements OnInit{
 password = '';
  token = '';
  loading$: Observable<boolean> | undefined;


  constructor(
    //private fb:FormBuilder,
 private loadingService: LoaderService,
 private router:Router,
    private route: ActivatedRoute,
    private toastrService:Toast,
    private _dao:AuthService){
    this.loading$ = this.loadingService.loading$;

    }




  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
      console.log('Token reçu depuis l\'URL : ', this.token);

  }

  onSubmit() {
    this._dao.resetPassword(this.token, this.password).subscribe(() => {
   //   alert('Mot de passe changé avec succès');
      this.toastrService.success('Mot de passe changé avec succès');
      this._dao.logout();
      this.router.navigate(['/login']);
    });
  }


}
