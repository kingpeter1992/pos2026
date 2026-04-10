import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';
import { CommandeAchatResponse, CommandeAchatRequest, CommandeAchatListItem } from '../../models/commande-achat.model';
import { CommandeAchat } from './commande-achat';

@Injectable({
  providedIn: 'root'
})
export class CommandeAchatStore {



  getDashboard() {
  this.loadDashboard();
  }



  private commandesSubject = new BehaviorSubject<CommandeAchatResponse[]>([]);
  commandes$ = this.commandesSubject.asObservable();

  private selectedCommandeSubject = new BehaviorSubject<CommandeAchatResponse | null>(null);
  selectedCommande$ = this.selectedCommandeSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  error$ = this.errorSubject.asObservable();

  private dashboardSubject = new BehaviorSubject<any>(null);
  dashboard$ = this.dashboardSubject.asObservable();

  private loaded = false;
  private currentRequest$: Observable<CommandeAchatResponse[]> | null = null;
  refreshDashboard: any;

  constructor(private api: CommandeAchat) {}

   findById(id: number): Observable<CommandeAchatResponse> {
  return this.api.findById(id);
}
  loadIfNeeded(): Observable<CommandeAchatResponse[]> {
    if (this.loaded && this.commandesSubject.value.length > 0) {
      return of(this.commandesSubject.value);
    }

    if (this.currentRequest$) {
      return this.currentRequest$;
    }

    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    this.currentRequest$ = this.api.findAll().pipe(
      tap(data => {
        this.commandesSubject.next(data);
        console.log('Commandes d\'achat chargées', data);
        this.loaded = true;
      }),
      catchError(err => {
        this.errorSubject.next(err?.error?.message || 'Erreur lors du chargement des commandes.');
        throw err;
      }),
      finalize(() => {
        this.loadingSubject.next(false);
        this.currentRequest$ = null;
      }),
      shareReplay(1)
    );

    return this.currentRequest$;
  }

  searchLocal(request: any): Observable<CommandeAchatResponse[]> {
    this.loadingSubject.next(true);

    const source = this.commandesSubject.value;
    let filtered = [...source];

    const keyword = (request?.keyword || '').toString().toLowerCase().trim();
    const fournisseur = (request?.fournisseur || '').toString().toLowerCase().trim();
    const position = request?.position || null;

    const dateDebut = request?.dateDebut ? new Date(request.dateDebut) : null;
    const dateFin = request?.dateFin ? new Date(request.dateFin) : null;

    if (keyword) {
      filtered = filtered.filter(item =>
        (item.reference || '').toLowerCase().includes(keyword) ||
        (item.fournisseurNom || '').toLowerCase().includes(keyword) ||
        (item.observation || '').toLowerCase().includes(keyword)
      );
    }

    if (fournisseur) {
      filtered = filtered.filter(item =>
        (item.fournisseurNom || '').toLowerCase().includes(fournisseur)
      );
    }

    if (position) {
      filtered = filtered.filter(item => item.statut === position);
    }

    if (dateDebut) {
      filtered = filtered.filter(item => {
        const dateCommande = new Date(item.dateCommande);
        return dateCommande >= dateDebut;
      });
    }

    if (dateFin) {
      filtered = filtered.filter(item => {
        const dateCommande = new Date(item.dateCommande);
        return dateCommande <= dateFin;
      });
    }

    if (request?.vingtDerniers) {
      filtered = filtered
        .sort((a, b) => new Date(b.dateCommande).getTime() - new Date(a.dateCommande).getTime())
        .slice(0, 20);
    }

    if (request?.enCours) {
      filtered = filtered.filter(item => item.statut === 'EN_COURS');
    }

    if (request?.terminee) {
      filtered = filtered.filter(item => item.statut === 'TERMINEE');
    }

    if (request?.partielLivre) {
      filtered = filtered.filter(item => item.statut === 'PARTIELLE_LIVREE');
    }

    if (request?.livre) {
      filtered = filtered.filter(item => item.statut === 'LIVREE');
    }

    if (request?.nonLivre) {
      filtered = filtered.filter(item => item.statut === 'NON_LIVREE');
    }

    if (request?.transferee) {
      filtered = filtered.filter(item => item.statut === 'TRANSFEREE');
    }

    this.commandesSubject.next(filtered);
    this.loadingSubject.next(false);

    return of(filtered);
  }

  resetSearch(): void {
    this.commandesSubject.next(this.commandesSubject.value);
  }


  reload(): Observable<CommandeAchatResponse[]> {
    this.loaded = false;
    return this.loadIfNeeded();
  }

  loadById(id: number): Observable<CommandeAchatResponse> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return new Observable<CommandeAchatResponse>(observer => {
      this.api.findById(id).subscribe({
        next: data => {
          this.selectedCommandeSubject.next(data);
          observer.next(data);
          observer.complete();
          this.loadingSubject.next(false);
        },
        error: err => {
          this.errorSubject.next(err?.error?.message || 'Erreur lors du chargement du détail.');
          this.loadingSubject.next(false);
          observer.error(err);
        }
      });
    });
  }

  loadDashboard(): void {
  this.loadingSubject.next(true);
  this.api.getDashboard().pipe(
    finalize(() => this.loadingSubject.next(false))
  ).subscribe({
    next: (data) => this.dashboardSubject.next(data),
    error: (err) => {
      console.error('Erreur chargement dashboard commande', err);
      this.dashboardSubject.next(null);
    }
  });
}

  create(request: CommandeAchatRequest): Observable<CommandeAchatResponse> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return new Observable<CommandeAchatResponse>(observer => {
      this.api.creer(request).subscribe({
        next: created => {
          this.commandesSubject.next([created, ...this.commandesSubject.value]);
          this.loaded = true;
          observer.next(created);
          observer.complete();
          this.loadingSubject.next(false);
        },
        error: err => {
          this.errorSubject.next(err?.error?.message || 'Erreur lors de la création.');
          this.loadingSubject.next(false);
          observer.error(err);
        }
      });
    });
  }
getById(id: number): CommandeAchatResponse | undefined {
  return this.commandesSubject.value.find(c => Number(c.id) === Number(id));
}

update(id: number, payload: CommandeAchatRequest): Observable<any> {
  return this.api.update(id, payload);
}


 updateInStore(commande: any): void {
    const current = this.commandesSubject.value ?? [];
    const index = current.findIndex(c => Number(c.id) === Number(commande.id));

    if (index === -1) {
      this.commandesSubject.next([commande, ...current]);
      return;
    }

    const updated = [...current];
    updated[index] = {
      ...updated[index],
      ...commande
    };

    this.commandesSubject.next(updated);
  }
  valider(id: number): Observable<CommandeAchatListItem> {
  this.loadingSubject.next(true);
  this.errorSubject.next(null);

  return this.api.valider(id).pipe(
    map(() => {
      const updated = this.commandesSubject.value.map(cmd =>
        cmd.id === id ? { ...cmd, statut: 'VALIDEE' } : cmd
      );
      this.commandesSubject.next(updated);

      const commandeMaj = updated.find(cmd => cmd.id === id)!;

      const current = this.selectedCommandeSubject.value;
      if (current && current.id === id) {
        this.selectedCommandeSubject.next(commandeMaj);
      }

      this.loadingSubject.next(false);
      return commandeMaj;
    }),
    catchError(err => {
      this.errorSubject.next(err?.error?.message || 'Erreur lors de la validation.');
      this.loadingSubject.next(false);
      return throwError(() => err);
    })
  );
}
  annuler(id: number): Observable<void> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return new Observable<void>(observer => {
      this.api.annuler(id).subscribe({
        next: () => {
          const updated = this.commandesSubject.value.map(cmd =>
            cmd.id === id ? { ...cmd, statut: 'ANNULEE' } : cmd
          );
          this.commandesSubject.next(updated);

          const current = this.selectedCommandeSubject.value;
          if (current && current.id === id) {
            this.selectedCommandeSubject.next({ ...current, statut: 'ANNULEE' });
          }

          observer.next();
          observer.complete();
          this.loadingSubject.next(false);
        },
        error: err => {
          this.errorSubject.next(err?.error?.message || 'Erreur lors de l’annulation.');
          this.loadingSubject.next(false);
          observer.error(err);
        }
      });
    });
  }

  clearSelected(): void {
    this.selectedCommandeSubject.next(null);
  }

   get snapshot(): CommandeAchatResponse[] {
    return this.commandesSubject.value;
  }
}
