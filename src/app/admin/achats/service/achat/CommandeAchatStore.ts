import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, shareReplay, take, tap } from 'rxjs/operators';
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



   refresh(): Observable<CommandeAchatListItem[]> {
  this.loaded = false;
  return this.loadIfNeeded();
}

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
       // console.log('Commandes d\'achat chargées', data);
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

searchLocal(filter: any): Observable<CommandeAchatListItem[]> {
  return this.commandes$.pipe(
    take(1),
    map((list: CommandeAchatListItem[]) => {
      let rows = [...(list ?? [])];

      const keyword = String(filter.keyword ?? '').trim().toLowerCase();
      const fournisseur = String(filter.fournisseur ?? '').trim().toLowerCase();
      const position = String(filter.position ?? '').trim().toLowerCase();

      const dateDebut = filter.dateDebut ? new Date(filter.dateDebut) : null;
      const dateFin = filter.dateFin ? new Date(filter.dateFin) : null;

      if (dateFin) {
        dateFin.setHours(23, 59, 59, 999);
      }

      if (keyword) {
        rows = rows.filter(c => {
          const text = [
            c.refCommande,
            c.libelle,
            c.fournisseurNom,
            c.statut,
            c.operateur,
            c.user,
            c.observation,
            c.devise
          ]
            .map(v => String(v ?? '').toLowerCase())
            .join(' ');

          return text.includes(keyword);
        });
      }

      if (fournisseur) {
        rows = rows.filter(c =>
          String(c.fournisseurNom ?? '').toLowerCase().includes(fournisseur)
        );
      }

      if (position) {
        rows = rows.filter(c =>
          String(
            (c as any).positionCommande ??
            (c as any).positionLivraison ??
            c.statut ??
            ''
          ).toLowerCase().includes(position)
        );
      }

      if (dateDebut || dateFin) {
        rows = rows.filter(c => {
          if (!c.dateCommande) return false;

          const d = new Date(c.dateCommande);

          if (dateDebut && d < dateDebut) return false;
          if (dateFin && d > dateFin) return false;

          return true;
        });
      }

      const statutsAutorises: string[] = [];

      if (filter.enCours) {
        statutsAutorises.push('BROUILLON', 'EN_COURS', 'VALIDEE', 'VALIDE');
      }

      if (filter.terminee) {
        statutsAutorises.push('RECEPTIONNEE', 'TERMINEE', 'CLOTUREE');
      }

      if (filter.nonLivre) {
        statutsAutorises.push('NON_LIVREE', 'NON_LIVRE');
      }

      if (filter.partielLivre) {
        statutsAutorises.push('RECEPTION_PARTIELLE', 'PARTIELLEMENT_LIVREE', 'PARTIEL_LIVRE');
      }

      if (filter.livre) {
        statutsAutorises.push('LIVREE', 'RECEPTIONNEE');
      }

      if (statutsAutorises.length > 0) {
        rows = rows.filter(c => {
          const statut = String(c.statut ?? '').trim().toUpperCase();
          return statutsAutorises.some(s => statut.includes(s));
        });
      }

      if (filter.mesCommandes) {
        const user = JSON.parse(sessionStorage.getItem('auth-user') || '{}');
        const username = String(
          user.username ?? user.userName ?? user.nom ?? user.email ?? ''
        ).toLowerCase();

        if (username) {
          rows = rows.filter(c =>
            String(c.operateur ?? c.user ?? '').toLowerCase().includes(username)
          );
        }
      }

      rows.sort((a, b) =>
        new Date(b.dateCommande ?? 0).getTime() -
        new Date(a.dateCommande ?? 0).getTime()
      );

      if (filter.vingtDerniers) {
        rows = rows.slice(0, 20);
      }

      return rows;
    })
  );
}
}
