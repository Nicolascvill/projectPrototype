import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { jwtDecode } from 'jwt-decode';

@Injectable({ providedIn: 'root' })
export class AuthRedirectGuard implements CanActivate {

    constructor(private router: Router, private authService: AuthService) {}

    canActivate(): boolean | UrlTree {
        const token = this.authService.getToken();
        if (token) {
            const decodedToken: any = this.decodeToken(token);

            if (decodedToken && decodedToken.exp) {
                const now = Date.now().valueOf() / 1000;
                if (decodedToken.exp > now) {
                    // Si el token es válido y no expirado, redirigimos al dashboard
                    return this.router.parseUrl('/dashboard');
                }
            }
            // Token inválido o expirado, limpiamos todo
            this.authService.logout();
            return this.router.parseUrl('/auth/login');
        } else {
            // No hay token, que siga en login
            return true;
        }
    }

    private decodeToken(token: string): any {
        try {
            return jwtDecode(token);
        } catch (error) {
            console.error('Error decoding token', error);
            return null;
        }
    }
}
