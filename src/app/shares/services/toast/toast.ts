import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';


@Injectable({
  providedIn: 'root',
})
export class Toast {

 constructor(private snackBar: MatSnackBar) {}
 success(message: string) {
    this.show(message, 'toast-success');
  }

  error(message: string) {
    this.show(message, 'toast-error');
  }

  info(message: string) {
    this.show(message, 'toast-info');
  }

  warning(message: string) {
    this.show(message, 'toast-warning');
  }

  private show(message: string, panelClass: string) {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: [panelClass]
    });
  }
}
