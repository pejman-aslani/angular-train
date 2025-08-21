import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, Observable, throwError, map } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {ToastrService} from 'ngx-toastr';

export interface ApiResult<T> {
  hasError: boolean;
  messages: string[];
  result: T;
}
export interface ApiResultArray<T> {
  hasError: boolean;
  messages: string[];
  result: {
    data: T[];
  };
}

@Injectable({
  providedIn: 'root',
})

export class HttpService {
  // private readonly baseUrl = `${window.location.protocol}//${window.location.hostname}`;
  private readonly baseUrl = `http://localhost:9000`;
  public readonly apiUrl =`https://localhost`;
  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly toast: ToastrService,
    private readonly modal: NgbModal
  ) {}

  private getToken(): string | null {
    return localStorage.getItem('access_token');
  }
  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  private handleUnauthorized(): void {
    this.toast.clear();
    localStorage.removeItem('access_token');
    this.modal.dismissAll();
    this.toast.error('جلسه منقضی شده است. لطفاً دوباره وارد شوید.');
    this.router.navigate(['/login']);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    if (error.status === 401) {
      this.handleUnauthorized();
      return throwError(() => new Error('Unauthorized'));
    }

    if (error.status === 422 && error.error) {
      try {
        const apiError = error.error as ApiResult<any>;
        if (apiError?.hasError && Array.isArray(apiError.messages)) {
          apiError.messages.forEach((msg) => this.toast.error(msg));
          return throwError(() => new Error(apiError.messages.join('; ')));
        }
      } catch (e) {
        this.toast.error('خطای نامشخص در پردازش پاسخ سرور.');
        return throwError(() => new Error('Invalid server response'));
      }
    }
    return throwError(() => error);
  }

  private processResponse<T>(response: ApiResult<T>): ApiResult<T> {
    if (!response || !Array.isArray(response.messages)) {
      this.toast.error('پاسخ سرور نامعتبر است.');
      throw new Error('Invalid server response');
    }

    response.messages.forEach((message) =>
      response.hasError
        ? this.toast.error(message)
        : this.toast.success(message)
    );

    if (response.hasError) {
      throw new Error(response.messages.join('; '));
    }

    return response;
  }

  get<T>(
    endpoint: string,
    options: { params?: any } = {}
  ): Observable<ApiResult<T>> {
    const url = `${this.baseUrl}/${endpoint}`;
    return this.http
      .get<ApiResult<T>>(url, {
        headers: this.getHeaders(),
        params: options.params,
      })
      .pipe(
        map((response) => this.processResponse(response)),
        catchError(this.handleError.bind(this))
      );
  }

  post<T>(endpoint: string, data: any): Observable<ApiResult<T>> {
    const url = `${this.baseUrl}/${endpoint}`;
    return this.http
      .post<ApiResult<T>>(url, data, { headers: this.getHeaders() })
      .pipe(
        map((response) => this.processResponse(response)),
        catchError(this.handleError.bind(this))
      );
  }

  put<T>(endpoint: string, data: any): Observable<ApiResult<T>> {
    const url = `${this.baseUrl}/${endpoint}`;
    return this.http
      .put<ApiResult<T>>(url, data, { headers: this.getHeaders() })
      .pipe(
        map((response) => this.processResponse(response)),
        catchError(this.handleError.bind(this))
      );
  }

  delete<T>(endpoint: string): Observable<ApiResult<T>> {
    const url = `${this.baseUrl}/${endpoint}`;
    return this.http
      .delete<ApiResult<T>>(url, { headers: this.getHeaders() })
      .pipe(
        map((response) => this.processResponse(response)),
        catchError(this.handleError.bind(this))
      );
  }
  downloadFile(endpoint: string): Observable<Blob> {
    const url = `${this.baseUrl}/${endpoint}`;
    return this.http
      .get(url, {
        headers: this.getHeaders(),
        responseType: 'blob',
      })
      .pipe(catchError(this.handleError.bind(this)));
  }

  uploadFile<T>(endpoint: string, file: File, extraData?: any): Observable<ApiResult<T>> {
    const url = `${this.baseUrl}/${endpoint}`;
    const formData = new FormData();

    formData.append('uploading_file', file, file.name);

    if (extraData) {
      Object.keys(extraData).forEach(key => {
        if (key !== 'uploading_file') {
          formData.append(key, extraData[key]);
        }
      });
    }
    let headers = this.getHeaders();
    headers = headers.delete('Content-Type');

    return this.http
      .post<ApiResult<T>>(url, formData, { headers })
      .pipe(
        map((response) => this.processResponse(response)),
        catchError(this.handleError.bind(this))
      );
  }


}
