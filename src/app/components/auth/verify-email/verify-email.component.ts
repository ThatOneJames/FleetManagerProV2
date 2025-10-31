import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-verify-email',
    templateUrl: './verify-email.component.html',
    styleUrls: ['./verify-email.component.css']
})
export class VerifyEmailComponent implements OnInit {
    loading = true;
    success = false;
    error: string | null = null;
    message: string = '';

    constructor(
        private route: ActivatedRoute,
        private http: HttpClient,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            const email = params['email'];
            const token = params['token'];

            if (!email || !token) {
                this.error = 'Invalid verification link';
                this.loading = false;
                return;
            }

            console.log('Verifying email:', email);

            this.http.post(`${environment.apiUrl}/auth/verify-email`, { email, token }).subscribe({
                next: (response: any) => {
                    this.loading = false;
                    this.success = true;
                    this.message = response.message || 'Email verified successfully! You can now login.';
                    console.log('Email verified:', response);

                    setTimeout(() => {
                        this.router.navigate(['/login']);
                    }, 3000);
                },
                error: (error: any) => {
                    this.loading = false;
                    this.error = error.error?.message || 'Verification failed. Please try again.';
                    console.error('Verification error:', error);
                }
            });
        });
    }

    goToLogin(): void {
        this.router.navigate(['/login']);
    }
}
