import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  getErrorMessage(err: any): string {

    if (!err) {
      return 'Erreur inconnue';
    }

    if (err.error?.message) {
      return err.error.message;
    }

    if (err.error?.error) {
      return err.error.error;
    }

    if (err.message) {
      return err.message;
    }

    return 'Une erreur est survenue';
  }

}
