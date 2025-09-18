import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { User, UserRole } from 'src/app/models/user.model';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    loginForm: FormGroup;
    errorMessage: string | null = null;
    loading = false;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router
    ) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    // Called from template
    async onSubmit() {
        if (this.loginForm.invalid) return;

        this.loading = true;
        this.errorMessage = null;

        const { email, password } = this.loginForm.value;

        this.authService.login(email, password).subscribe({
            next: (user: User | null) => {
                this.loading = false;
                if (user) {
                    if (user.role === UserRole.Admin) {
                        this.router.navigate(['/admin']);
                    } else {
                        this.router.navigate(['/driver']);
                    }
                } else {
                    this.errorMessage = 'Invalid credentials. Please try again.';
                }
            },
            error: (err: any) => {
                this.loading = false;
                this.errorMessage = err.message || 'Login failed. Please try again.';
            }
        });
    }

    // Getters for form controls (used in template for cleaner access)
    get email() {
        return this.loginForm.get('email');
    }

    get password() {
        return this.loginForm.get('password');
    }
}
