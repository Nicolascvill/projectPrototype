import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { jwtDecode } from 'jwt-decode';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

    constructor(private router: Router, private authService: AuthService) { }

    canActivate(): boolean | UrlTree {
        const token = this.authService.getToken();
        if (token) {
            const decodedToken: any = this.decodeToken(token);

            if (decodedToken && decodedToken.exp) {
                const now = Date.now().valueOf() / 1000;
                if (decodedToken.exp > now) {
                    this.authService.startAutoLogout();
                    return true;
                }
            }
            //si token expiro o es invalido
            this.authService.logout();
            return this.router.parseUrl('/auth/login');
        } else {
            return this.router.parseUrl('/auth/login');
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