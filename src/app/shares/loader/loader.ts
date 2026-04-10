import { Component, Input, OnInit  } from '@angular/core';
import { LoaderService } from '../services/loader/loader-service';
import { Observable } from 'rxjs/internal/Observable';

@Component({
  selector: 'app-loader',
  standalone:false,
  templateUrl: './loader.html',
  styleUrl: './loader.css',
})
export class Loader  implements OnInit {

  loading$!: Observable<boolean>;

  constructor(public loaderService: LoaderService) {}
 ngOnInit(): void {
    this.loading$ = this.loaderService.loading$;
  }
}
