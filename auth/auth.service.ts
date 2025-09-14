import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import {HttpService} from '../http-request/http.service';



interface ApiResult<T> {
  hasError: boolean;
  messages: string[];
  result: T;
}

interface LoginResponse {
  auth: boolean;
  token: string;
  username: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public currentUserSubject = new BehaviorSubject<string | null>(localStorage.getItem('username'));
  constructor(private httpService: HttpService) {}
  login(credentials: { username: string; password: string; rememberMe: boolean }): Observable<ApiResult<LoginResponse>> {
    return this.httpService.post<LoginResponse>('users/login', credentials).pipe(
      tap((response: ApiResult<LoginResponse>) => {
        if (!response.hasError && response.result?.auth) {
          localStorage.setItem('access_token', response.result.token);
          localStorage.setItem('username', response.result.username);
          this.currentUserSubject.next(response.result.username);
        }
      })
    );
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

}
