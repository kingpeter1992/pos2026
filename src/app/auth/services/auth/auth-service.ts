import { Injectable, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { finalize, Observable } from 'rxjs';
import { LoaderService } from '../../../shares/services/loader/loader-service';
import { StorageService } from '../storage/storage-service';
import { environment } from '../../../../environnement/environment';
import { HttpHeaders, HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
 private BASIC_URL_AUTH_LOGIN = environment.BASIC_URL_AUTH_LOGIN;
  private BASIC_URL_REGISTER = environment.BASIC_URL_REGISTER;
  private BASIC_URL_FORGOT = environment.BASIC_URL_FORGOT;
  private BASIC_URL_RESET = environment.BASIC_URL_RENITIALISATION;
  private BASIC_URL_ADMIN = environment.BASIC_URL_ADMIN;

  private httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json',
  //  Authorization: `Bearer ${token}`
  })
};

  constructor(
    private http: HttpClient,
    private loaderService: LoaderService
  ) {}

  // ======================== Auth ========================
  login(username: string, password: string): Observable<any> {
    this.loaderService.show();
    return this.http
      .post(
        this.BASIC_URL_AUTH_LOGIN,
        { username, password },
        this.httpOptions
      )
      .pipe(finalize(() => this.loaderService.hide()));
  }

  register(username: string, email: string, password: string): Observable<any> {
    this.loaderService.show();
    return this.http
      .post(
        this.BASIC_URL_REGISTER,
        { username, email, password },
        this.httpOptions
      )
      .pipe(finalize(() => this.loaderService.hide()));
  }

  createdUser(body: any): Observable<any> {
    return this.http.post(this.BASIC_URL_REGISTER, body, this.httpOptions);
  }

  getUser(username: string): Observable<any> {
    return this.http.get(`${this.BASIC_URL_REGISTER}api/findusername/${username}`);
  }

  logout(): Observable<any> {
    return this.http.post(`${environment.BASIC_URL}signout`, {}, this.httpOptions);
  }

  forgotPassword(email: string): Observable<any> {
    this.loaderService.show();
    return this.http
      .post(this.BASIC_URL_FORGOT, { email }, this.httpOptions)
      .pipe(finalize(() => this.loaderService.hide()));
  }

  resetPassword(token: string, password: string): Observable<any> {
    this.loaderService.show();
    return this.http
      .post(this.BASIC_URL_RESET, { token, password }, this.httpOptions)
      .pipe(finalize(() => this.loaderService.hide()));
  }

  // ======================== Admin ========================
  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.BASIC_URL_ADMIN);
  }

  blockUser(userId: number): Observable<any> {
    return this.http.put(`${this.BASIC_URL_ADMIN}/${userId}/block`, {}, this.httpOptions);
  }

  unblockUser(userId: number): Observable<any> {
    return this.http.put(`${this.BASIC_URL_ADMIN}/${userId}/unblock`, {}, this.httpOptions);
  }

  assignRoles(userId: number, roles: string[]): Observable<any> {
    return this.http.put(`${this.BASIC_URL_ADMIN}/${userId}/roles`, roles, this.httpOptions);
  }
}
