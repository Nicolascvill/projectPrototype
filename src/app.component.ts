import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from './app/services/auth.service';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule],
    template: `<router-outlet></router-outlet>`
})
export class AppComponent implements OnInit {
    constructor(private authService: AuthService) { }

    ngOnInit(): void {
        const token = this.authService.getToken();
        if (token) {
            this.authService.startSessionPing();
        }
    }

}
