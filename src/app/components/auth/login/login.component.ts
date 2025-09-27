import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit { // Make sure this export exists
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

    ngOnInit(): void {
        // Check if user is already logged in
        if (this.authService.isAuthenticated()) {
            const userRole = this.authService.getUserRole();
            this.redirectBasedOnRole(userRole);
        }

        // Add demo credentials for testing
        console.log('Demo credentials available:');
        console.log('- Email: driver@test.com, Password: password123');
        console.log('- Or create new accounts using the demo buttons');
    }

    async onSubmit(): Promise<void> {
        if (this.loginForm.invalid) {
            this.markFormGroupTouched();
            return;
        }

        this.loading = true;
        this.errorMessage = null;

        const { email, password } = this.loginForm.value;
        console.log('Attempting login for:', email);

        this.authService.login(email, password).subscribe({
            next: (user: User | null) => {
                this.loading = false;
                console.log('Login successful, user:', user);

                if (user) {
                    console.log('User role:', user.role);
                    this.redirectBasedOnRole(user.role);
                } else {
                    this.errorMessage = 'Login failed. Invalid credentials.';
                }
            },
            error: (error: any) => {
                this.loading = false;
                console.error('Login error:', error);

                if (error.status === 401) {
                    this.errorMessage = 'Invalid email or password.';
                } else if (error.status === 500) {
                    this.errorMessage = 'Server error. Please try again later.';
                } else {
                    this.errorMessage = error.error?.message || 'Login failed. Please try again.';
                }
            }
        });
    }

    private redirectBasedOnRole(role: string | null): void {
        switch (role) {
            case 'Admin':
                console.log('Redirecting to admin dashboard');
                this.router.navigate(['/admin/dashboard']);
                break;
            case 'Driver':
                console.log('Redirecting to driver dashboard');
                this.router.navigate(['/driver/dashboard']);
                break;
            default:
                console.log('Unknown role, redirecting to general dashboard');
                this.router.navigate(['/dashboard']);
                break;
        }
    }

    private markFormGroupTouched(): void {
        Object.keys(this.loginForm.controls).forEach(key => {
            const control = this.loginForm.get(key);
            control?.markAsTouched();
        });
    }

    hasError(fieldName: string, errorType: string): boolean {
        const field = this.loginForm.get(fieldName);
        return !!(field?.hasError(errorType) && (field?.dirty || field?.touched));
    }

    getErrorMessage(fieldName: string): string {
        const field = this.loginForm.get(fieldName);
        if (field?.hasError('required')) {
            return `${fieldName} is required`;
        }
        if (field?.hasError('email')) {
            return 'Please enter a valid email address';
        }
        if (field?.hasError('minlength')) {
            return `${fieldName} must be at least ${field.errors?.['minlength']?.requiredLength} characters`;
        }
        return '';
    }

    // Getters for template access
    get email() {
        return this.loginForm.get('email');
    }

    get password() {
        return this.loginForm.get('password');
    }

    // Test method to try logging in with existing driver account
    loginAsTestDriver(): void {
        this.loginForm.patchValue({
            email: 'driver@test.com',
            password: 'password123'
        });
        this.onSubmit();
    }

    // Method to create and login as demo admin (for testing)
    createDemoAdmin(): void {
        console.log('This would create a demo admin account - implement registration first');
        // You can implement this if you add a registration endpoint
    }
}