import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpInterceptor,
  HttpEvent,
  HttpErrorResponse,
  HttpResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap,catchError, finalize } from 'rxjs/operators';
import { Toast } from '../../../shares/services/toast/toast';
import { StorageService } from '../storage/storage-service';
import { LoaderService } from '../../../shares/services/loader/loader-service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

constructor(
    private storageService: StorageService,
    private toastrService: Toast, // Votre service Toast (assurez-vous qu'il a une méthode success())
    private loaderService: LoaderService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.loaderService.show();

    const token = this.storageService.getToken();
    const authReq = token
      ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
      : req;


    //  console.log('Token intercepté =', token);
    // console.log('URL =', req.url);
    // console.log('Headers =', req.headers);

    return next.handle(authReq).pipe(
      tap((event: HttpEvent<any>) => {
        // ✅ GESTION DU SUCCÈS
        if (event instanceof HttpResponse) {
          const body = event.body;
          // Si votre backend renvoie { success: true, message: "..." }
          if (body && body.success === true && body.message) {
            this.toastrService.success(body.message); // On affiche le toast de succès
          }
        }
      }),
      catchError((error: HttpErrorResponse) => {
        // ❌ GESTION DE L'ERREUR (Votre code actuel est parfait ici)
        let errorMessage = this.extractErrorMessage(error);
        this.toastrService.error(errorMessage);
        return throwError(() => error);
      }),
      finalize(() => {
        this.loaderService.hide();
      })
    );
  }

  // Petite fonction utilitaire pour isoler la logique de parsing d'erreur
  private extractErrorMessage(error: HttpErrorResponse): string {
    if (error.error) {
      if (typeof error.error === 'object' && error.error.message) return error.error.message;
      if (typeof error.error === 'string') {
        try {
          const parsed = JSON.parse(error.error);
          return parsed.message || error.error;
        } catch { return error.error; }
      }
    }
    switch (error.status) {
      case 400: return 'Requête incorrecte.';
      case 401: return 'Session expirée.';
      case 403: return 'Accès refusé.';
      case 500: return 'Erreur interne du serveur.';
      default: return 'Une erreur inattendue est survenue.';
    }
  }
}
