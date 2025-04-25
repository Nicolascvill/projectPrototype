import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { MessageService } from 'primeng/api';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private logoutTimer: any;
    private preAlertTimer: any;
    private apiUrl = 'http://localhost:3000/auth'; // backend NestJS

    constructor(private http: HttpClient,
                private router: Router,
                private messageService: MessageService) {}

    login(email: string, password: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/login`, { email, password });
    }

    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('refreshToken');
        this.clearTimers();
        this.router.navigate(['/auth/login']);
    }

    getToken(): string | null {
        return localStorage.getItem('token') || sessionStorage.getItem('token');
    }

    getRefreshToken(): string | null {
        return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
    }

    saveTokens(accessToken: string, refreshToken: string): void {
        if (localStorage.getItem('token')) {
            localStorage.setItem('token', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
        } else {
            sessionStorage.setItem('token', accessToken);
            sessionStorage.setItem('refreshToken', refreshToken);
        }
    }

    refreshToken(refreshToken: string): Observable<any> {
        const userId = this.getUserIdFromToken();
        if (!userId) {
            this.logout();
            return of(null);
        }
        return this.http.post(`${this.apiUrl}/refresh`, { userId, refreshToken });
    }

    private getUserIdFromToken(): number | null {
        const token = this.getToken();
        if (!token) return null;
        const decoded: any = this.decodeToken(token);
        return decoded?.sub || null;
    }

    startAutoLogout(): void {
        this.clearTimers();

        const token = this.getToken();
        if (!token) return;

        const decoded: any = this.decodeToken(token);
        if (!decoded || !decoded.exp) return;

        const now = Date.now().valueOf() / 1000;
        const expiresIn = decoded.exp - now;

        if (expiresIn <= 0) {
            this.logout();
            return;
        }

        const preAlertTime = expiresIn - 120;
        if (preAlertTime > 0) {
            this.preAlertTimer = setTimeout(() => {
                this.showSessionExpiryWarning();
            }, preAlertTime * 1000);
        }

        this.logoutTimer = setTimeout(() => {
            this.logout();
        }, expiresIn * 1000);
    }

    private decodeToken(token: string): any {
        try {
            return jwtDecode(token);
        } catch (error) {
            console.error('Error decoding token', error);
            return null;
        }
    }

    private clearTimers(): void {
        if (this.logoutTimer) {
            clearTimeout(this.logoutTimer);
            this.logoutTimer = null;
        }
        if (this.preAlertTimer) {
            clearTimeout(this.preAlertTimer);
            this.preAlertTimer = null;
        }
    }

    private showSessionExpiryWarning(): void {
        this.messageService.add({
            severity: 'warn',
            summary: 'Tu sesión expirará pronto',
            detail: 'Por favor guarda tus cambios o vuelve a iniciar sesión.',
            life: 10000
        });
    }
}
