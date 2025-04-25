import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    constructor(private authService: AuthService) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const token = this.authService.getToken();

        if (token) {
            req = req.clone({
                setHeaders: { Authorization: `Bearer ${token}` }
            });
        }

        return next.handle(req).pipe(
            catchError((error) => {
                if (error instanceof HttpErrorResponse && error.status === 401) {
                    const refreshToken = this.authService.getRefreshToken();
                    if (refreshToken) {
                        return this.authService.refreshToken(refreshToken).pipe(
                            switchMap((tokens) => {
                                this.authService.saveTokens(tokens.accessToken, tokens.refreshToken);

                                const clonedRequest = req.clone({
                                    setHeaders: { Authorization: `Bearer ${tokens.accessToken}` }
                                });
                                return next.handle(clonedRequest);
                            }),
                            catchError((refreshError) => {
                                this.authService.logout();
                                return throwError(() => refreshError);
                            })
                        );
                    } else {
                        this.authService.logout();
                    }
                }
                return throwError(() => error);
            })
        );
    }
}
