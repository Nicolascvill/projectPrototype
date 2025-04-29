import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { jwtDecode } from 'jwt-decode';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    constructor(private authService: AuthService) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        console.log('🛡️ Interceptor: token actual:', token);
        if (!token) {
            console.warn('⚠️ Interceptor: sin token aún, saltando autorización')
            return next.handle(req);
        } else {
            console.log('🛡️ Interceptor: token actual:', token);
            req = req.clone({
                setHeaders: { Authorization: `Bearer ${token}` }
            });
        }
        /*
        if (token) {
            req = req.clone({
                setHeaders: { Authorization: `Bearer ${token}` }
            });
        }
*/
        return next.handle(req).pipe(
            catchError((error) => {
                if (error instanceof HttpErrorResponse && error.status === 401) {
                    const refreshToken = this.authService.getRefreshToken();
                    if (refreshToken) {
                        return this.authService.refreshToken(refreshToken).pipe(
                            switchMap((tokens) => {
                                this.authService.saveTokens(tokens.accessToken, tokens.refreshToken);
                                console.log('♻️ Nuevo accessToken recibido del refresh:', tokens.accessToken);
                                this.authService.startSessionPing();
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
                        return throwError(() => error);
                    }
                }
                return throwError(() => error);
            })
        );
    }
}
