import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { finalize, shareReplay, tap } from 'rxjs/operators';
import { ProduitResponse } from '../models/produit.model';
import { ProduitService } from '../service/produit-service/produit-service';


@Injectable({
  providedIn: 'root'
})
export class ProduitStoreService {

  private produitsSubject = new BehaviorSubject<ProduitResponse[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  private loaded = false;
  private currentRequest$?: Observable<ProduitResponse[]>;

  produits$ = this.produitsSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  constructor(private productService: ProduitService) {}

  get value(): ProduitResponse[] {
    return this.produitsSubject.value;
  }

  loadIfNeeded(): Observable<ProduitResponse[]> {
    if (this.loaded) {
      return of(this.produitsSubject.value);
    }

    if (this.currentRequest$) {
      return this.currentRequest$;
    }

    this.loadingSubject.next(true);

    this.currentRequest$ = this.productService.findAll().pipe(
      tap((data) => {
        this.produitsSubject.next(data);
        this.loaded = true;
      }),
      finalize(() => {
        this.loadingSubject.next(false);
        this.currentRequest$ = undefined;
      }),
      shareReplay(1)
    );

    return this.currentRequest$;
  }

  refresh(): Observable<ProduitResponse[]> {
    this.loaded = false;
    return this.loadIfNeeded();
  }

  addOne(produit: ProduitResponse): void {
    this.produitsSubject.next([produit, ...this.produitsSubject.value]);
  }

  updateOne(produit: ProduitResponse): void {
    this.produitsSubject.next(
      this.produitsSubject.value.map(p => p.id === produit.id ? produit : p)
    );
  }

  findByCodeBarresLocal(codeBarres: string): ProduitResponse | undefined {
    return this.produitsSubject.value.find(p => p.codeBarres === codeBarres);
  }

  removeOne(id: number): void {
    this.produitsSubject.next(
      this.produitsSubject.value.filter(p => p.id !== id)
    );
  }
}
