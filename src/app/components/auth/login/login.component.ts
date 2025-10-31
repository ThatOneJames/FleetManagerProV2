import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
    loginForm: FormGroup;
    registerForm: FormGroup;
    errorMessage: string | null = null;
    successMessage: string | null = null;
    emailValidationError: string = '';
    loading = false;
    codeSending = false;
    showPassword = false;
    showRegisterPassword = false;
    isRegisterMode = false;
    codeRequested = false;
    codeCountdown = 0;

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private http: HttpClient
    ) {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });

        this.registerForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            verificationCode: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    ngOnInit(): void {
        if (this.authService.isAuthenticated()) {
            const userRole = this.authService.getUserRole();
            this.redirectBasedOnRole(userRole);
        }
    }

    toggleMode(): void {
        this.isRegisterMode = !this.isRegisterMode;
        this.errorMessage = null;
        this.successMessage = null;
        this.emailValidationError = '';
        this.codeRequested = false;
        this.codeCountdown = 0;
        this.loginForm.reset();
        this.registerForm.reset();
    }

    togglePasswordVisibility(): void {
        this.showPassword = !this.showPassword;
    }

    toggleRegisterPasswordVisibility(): void {
        this.showRegisterPassword = !this.showRegisterPassword;
    }

    onEmailBlur(): void {
        const email = this.registerForm.get('email')?.value;
        if (email && this.registerForm.get('email')?.valid) {
            this.emailValidationError = 'Validating email domain...';

            this.http.post(`${environment.apiUrl}/auth/validate-email`, { email }).subscribe({
                next: (response: any) => {
                    if (response.isValid) {
                        this.emailValidationError = '';
                    } else {
                        this.emailValidationError = response.message || 'Invalid email domain';
                    }
                },
                error: (error) => {
                    this.emailValidationError = '';
                }
            });
        }
    }

    async onSubmit(): Promise<void> {
        if (this.loginForm.invalid) {
            this.markFormGroupTouched(this.loginForm);
            return;
        }

        this.loading = true;
        this.errorMessage = null;

        const { email, password } = this.loginForm.value;

        this.authService.login(email, password).subscribe({
            next: (user: User | null) => {
                this.loading = false;

                if (user) {
                    this.redirectBasedOnRole(user.role);
                } else {
                    this.errorMessage = 'Login failed. Invalid credentials.';
                }
            },
            error: (error: any) => {
                this.loading = false;
                if (error.status === 401) {
                    this.errorMessage = error.error?.message || 'Invalid email or password.';
                } else if (error.status === 500) {
                    this.errorMessage = 'Server error. Please try again later.';
                } else {
                    this.errorMessage = error.error?.message || 'Login failed. Please try again.';
                }
            }
        });
    }

    async sendVerificationCode(): Promise<void> {
        const email = this.registerForm.get('email')?.value;

        if (!email || this.registerForm.get('email')?.invalid) {
            this.errorMessage = 'Please enter a valid email address';
            return;
        }

        if (this.emailValidationError) {
            this.errorMessage = 'Please provide a valid email address from a registered domain';
            return;
        }

        this.codeSending = true;
        this.errorMessage = null;
        this.successMessage = null;

        this.http.post(`${environment.apiUrl}/auth/request-verification-code`, { email }).subscribe({
            next: (response: any) => {
                this.codeSending = false;
                this.successMessage = 'Verification code sent to your email!';
                this.codeRequested = true;
                this.startCodeCountdown();
            },
            error: (error: any) => {
                this.codeSending = false;
                if (error.status === 400) {
                    this.errorMessage = error.error?.message || 'Email already registered';
                } else if (error.status === 500) {
                    this.errorMessage = 'Server error. Please try again later.';
                } else {
                    this.errorMessage = error.error?.message || 'Failed to send code. Try again.';
                }
            }
        });
    }

    async onRegister(): Promise<void> {
        if (this.registerForm.invalid) {
            this.markFormGroupTouched(this.registerForm);
            return;
        }

        if (this.emailValidationError) {
            this.errorMessage = 'Please provide a valid email address from a registered domain';
            return;
        }

        if (!this.codeRequested) {
            this.errorMessage = 'Please send verification code first';
            return;
        }

        this.loading = true;
        this.errorMessage = null;
        this.successMessage = null;

        const { name, email, password, verificationCode } = this.registerForm.value;

        try {
            console.log('Starting registration process...');

            const registerPayload = {
                name,
                email: email.toLowerCase().trim(),
                password,
                verificationCode,
                role: 'Driver',
                status: 'Active',
                phone: '',
                address: '',
                dateOfBirth: null,
                hireDate: new Date(),
                emergencyContact: '',
                profileImageUrl: '',
                licenseNumber: '',
                licenseClass: '',
                licenseExpiry: null,
                experienceYears: 0,
                safetyRating: 0.0,
                totalMilesDriven: 0.0,
                isAvailable: true,
                hasHelper: false
            };

            console.log('Sending registration payload...');
            this.http.post(`${environment.apiUrl}/auth/register`, registerPayload).subscribe({
                next: (response: any) => {
                    this.loading = false;
                    console.log('Registration successful:', response);
                    this.successMessage = 'Registration successful! Redirecting to login...';
                    this.registerForm.reset();

                    setTimeout(() => {
                        this.isRegisterMode = false;
                        this.successMessage = null;
                        this.codeRequested = false;
                        this.codeCountdown = 0;
                        this.errorMessage = null;
                    }, 2000);
                },
                error: (error: any) => {
                    this.loading = false;
                    console.error('Registration error:', error);

                    if (error.error && error.error.error) {
                        this.emailValidationError = error.error.error;
                        this.errorMessage = error.error.message || 'Invalid email address';
                    } else if (error.status === 400) {
                        this.errorMessage = error.error?.message || 'Registration failed. Invalid code or email.';
                    } else if (error.status === 500) {
                        this.errorMessage = 'Server error. Please try again later.';
                    } else {
                        this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
                    }
                }
            });
        } catch (error) {
            this.loading = false;
            console.error('Registration error:', error);
            this.errorMessage = 'Registration failed. Please try again.';
        }
    }

    startCodeCountdown(): void {
        this.codeCountdown = 300; // 5 minutes
        const interval = setInterval(() => {
            this.codeCountdown--;
            if (this.codeCountdown <= 0) {
                clearInterval(interval);
                this.codeRequested = false;
            }
        }, 1000);
    }

    getCountdownDisplay(): string {
        const mins = Math.floor(this.codeCountdown / 60);
        const secs = this.codeCountdown % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    private redirectBasedOnRole(role: string | null): void {
        switch (role) {
            case 'Admin':
                this.router.navigate(['/admin/dashboard']);
                break;
            case 'Driver':
                this.router.navigate(['/driver/dashboard']);
                break;
            default:
                this.router.navigate(['/dashboard']);
                break;
        }
    }

    private markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach(key => {
            const control = formGroup.get(key);
            control?.markAsTouched();
        });
    }

    hasError(formGroup: FormGroup, fieldName: string, errorType: string): boolean {
        const field = formGroup.get(fieldName);
        return !!(field?.hasError(errorType) && (field?.dirty || field?.touched));
    }

    get email() {
        return this.loginForm.get('email');
    }

    get password() {
        return this.loginForm.get('password');
    }

    get registerName() {
        return this.registerForm.get('name');
    }

    get registerEmail() {
        return this.registerForm.get('email');
    }

    get verificationCode() {
        return this.registerForm.get('verificationCode');
    }

    get registerPassword() {
        return this.registerForm.get('password');
    }
}
