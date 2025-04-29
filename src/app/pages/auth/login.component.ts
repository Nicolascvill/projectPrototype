import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { RippleModule } from 'primeng/ripple';
import { AppFloatingConfigurator } from '../../layout/component/app.floatingconfigurator';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-login',
    standalone: true,
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    imports: [CommonModule, ButtonModule, CheckboxModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, AppFloatingConfigurator, ToastModule,
        ProgressSpinnerModule
    ],
    providers: [MessageService],
})

export class Login {
    email: string = '';
    password: string = '';
    checked: boolean = false;
    loading: boolean = false;

    constructor(private router: Router,
        private messageService: MessageService,
        private authService: AuthService
    ) { }

    ngOnInit() {
        const token = this.authService.getToken();
        if (token) {
            const decoded: any = this.authService['decodeToken']?.(token);
            const now = Date.now() / 1000;
            if (decoded?.exp && decoded.exp > now) {
                this.router.navigate(['dashboard']);
            }
        }
    }

    onLogin() {
        this.loading = true;
        this.authService.login(this.email, this.password).subscribe({
            next: (response) => {
                this.loading = false;
                if (this.checked) {
                    localStorage.setItem('remember', 'true');
                } else {
                    sessionStorage.setItem('remember', 'false');
                }
                this.authService.saveTokens(response.accessToken, response.refreshToken);

                this.router.navigate(['/dashboard']).then(() => {
                    setTimeout(()=>{
                        this.authService.startSessionPing();  // <-- Este es el momento correcto
                    },100);
                });
            },
            error: () => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'Credenciales inválidas',
                    detail: 'El usuario o la contraseña no son correctos',
                    life: 3000
                });
            }
        });
    }


}
