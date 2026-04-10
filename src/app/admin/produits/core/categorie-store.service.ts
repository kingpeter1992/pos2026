import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { finalize, shareReplay, tap } from 'rxjs/operators';
import { CategorieResponse } from '../models/categorie.model';
import { CategorieService } from '../service/categorie-service/categorie-service';

@Injectable({
  providedIn: 'root'
})
export class CategorieStoreService {
  private categoriesSubject = new BehaviorSubject<CategorieResponse[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  private loaded = false;
  private currentRequest$?: Observable<CategorieResponse[]>;

  categories$ = this.categoriesSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();

  constructor(private categorieService: CategorieService) {}

  get value(): CategorieResponse[] {
    return this.categoriesSubject.value;
  }

  loadIfNeeded(): Observable<CategorieResponse[]> {
    if (this.loaded) {
      return of(this.categoriesSubject.value);
    }

    if (this.currentRequest$) {
      return this.currentRequest$;
    }

    this.loadingSubject.next(true);

    this.currentRequest$ = this.categorieService.findAllActives().pipe(
      tap((data) => {
        this.categoriesSubject.next(data)
        console.log('Categorie chargé depuis la con', data)
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

  refresh(): Observable<CategorieResponse[]> {
    this.loaded = false;
    return this.loadIfNeeded();
  }

  addOne(categorie: CategorieResponse): void {
    this.categoriesSubject.next([...this.categoriesSubject.value, categorie]);
  }

  updateOne(categorie: CategorieResponse): void {
    const updated = this.categoriesSubject.value.map(c =>
      c.id === categorie.id ? categorie : c
    );
    this.categoriesSubject.next(updated);
  }

  removeOne(id: number): void {
    const filtered = this.categoriesSubject.value.filter(c => c.id !== id);
    this.categoriesSubject.next(filtered);
  }

  findByIdLocal(id: number): CategorieResponse | undefined {
    return this.categoriesSubject.value.find(c => c.id === id);
  }


}
