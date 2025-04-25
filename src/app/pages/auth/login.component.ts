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
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    imports: [ButtonModule, CheckboxModule, InputTextModule, PasswordModule, FormsModule, RouterModule, RippleModule, AppFloatingConfigurator, ToastModule],
    providers: [MessageService],
})

export class Login {
    email: string = '';
    password: string = '';
    checked: boolean = false;

    constructor(private router: Router,
        private messageService: MessageService,
        private authService: AuthService
    ) { }

    ngOnInit() {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
            this.router.navigate(['dashboard']);
        }
    }

    onLogin() {
        this.authService.login(this.email, this.password).subscribe({
            next: (response) => {
                this.authService.saveTokens(response.accessToken, response.refreshToken);
    
                if (this.checked) {
                    localStorage.setItem('remember', 'true');
                } else {
                    sessionStorage.setItem('remember', 'false');
                }
    
                this.router.navigate(['/dashboard']);
            },
            error: () => {
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
