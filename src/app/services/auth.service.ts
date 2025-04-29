import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { MessageService } from 'primeng/api';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private logoutTimer: any;
    private preAlertTimer: any;
    private pingInterval: any;
    private apiUrl = environment.apiUrl; // backend NestJS

    constructor(
        private http: HttpClient,
        private router: Router,
        private messageService: MessageService) { }

    login(email: string, password: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/login`, { email, password });
    }

    logout(): void {
        console.warn('🚪 Logout ejecutado desde AuthService');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('refreshToken');
        this.clearTimers();
        this.router.navigate(['/auth/login']);
    }

    getToken(): string | null {
        const local = localStorage.getItem('token');
        const session = sessionStorage.getItem('token');
        return local || session;
    }

    getRefreshToken(): string | null {
        return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
    }

    saveTokens(accessToken: string, refreshToken: string): void {
        const remember = localStorage.getItem('remember') === 'true';
        if (remember) {
            localStorage.setItem('token', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
        } else {
            sessionStorage.setItem('token', accessToken);
            sessionStorage.setItem('refreshToken', refreshToken);
        }
        console.log('✅ Tokens guardados correctamente');
    }

    refreshToken(refreshToken: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/refresh`, { refreshToken });
    }

    startAutoLogout(): void {
        this.clearTimers();

        const token = this.getToken();
        console.log('🎯 Token actual en startSessionPing:', token);
        if (!token) return;

        const decoded: any = this.decodeToken(token);
        if (!decoded || !decoded.exp) return;

        const now = Date.now().valueOf() / 1000;
        const expiresIn = decoded.exp - now;

        if (expiresIn <= 0) return;

        const preAlertTime = expiresIn - 120; // 2 min antes
        if (preAlertTime > 0) {
            this.preAlertTimer = setTimeout(() => {
                this.showSessionExpiryWarning();
            }, preAlertTime * 1000);
        }

        this.logoutTimer = setTimeout(() => {
            this.logout();
        }, expiresIn * 1000);
    }

    startSessionPing(): void {
        const token = this.getToken();
        if (!token) {
            console.warn('⚠️ Ping abortado, sin token');
            return;
        }
        console.log('✅ startSessionPing() inicializado con token');
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
            console.log('⏱ Ping disparado');
            this.ping();
        }, 10000); // cada 10 segundos

    }


    private ping(): void {
        const token = this.getToken();
        if (!token) {
            console.warn('⚠️ No hay token disponible en ping()');
            this.logout();
            return;
        }

        const decoded = this.decodeToken(token);
        console.log('📤 SID enviado:', decoded?.sid);
        console.log('🔐 Token usado en ping():', token);

        fetch('http://172.21.166.55:3000/users/ping', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => {
                console.log('📥 Respuesta del backend:', res.status);
                if (res.status === 401) {
                    console.warn('❌ Ping inválido, cerrando sesión');
                    this.logout();
                    return null;
                }
                return res.json();
            })
            .then((data) => {
                if (data) console.log('✅ Ping válido:', data);
            })
            .catch((err) => {
                console.error('⚠️ Error en ping:', err);
                this.logout();
            });
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
        if (this.logoutTimer) clearTimeout(this.logoutTimer);
        console.log('🧹 Timer de logout limpiado');
        if (this.preAlertTimer) clearTimeout(this.preAlertTimer);
        console.log('🧹 Timer de pre-alerta limpiado');
        if (this.pingInterval) clearInterval(this.pingInterval);
        console.log('🧹 Intervalo de ping limpiado');

        this.logoutTimer = null;
        this.preAlertTimer = null;
        this.pingInterval = null;
    }



    private showSessionExpiryWarning(): void {
        this.messageService.add({
            severity: 'warn',
            summary: 'Tu sesión expirará pronto',
            detail: 'Por favor guarda tus cambios o vuelve a iniciar sesión.',
            life: 10000
        });
    }

    validateSessionContinuously(): void {
        this.startAutoLogout(); // Para control de expiración local
        this.startSessionPing(); // Para control de sesión remota
    }
}
