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
    showPassword = false;
    showRegisterPassword = false;
    isRegisterMode = false;

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
                    this.errorMessage = 'Invalid email or password.';
                } else if (error.status === 500) {
                    this.errorMessage = 'Server error. Please try again later.';
                } else {
                    this.errorMessage = error.error?.message || 'Login failed. Please try again.';
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

        this.loading = true;
        this.errorMessage = null;
        this.successMessage = null;

        const { name, email, password } = this.registerForm.value;

        try {
            const recaptchaToken = await this.getRecaptchaToken();

            const registerPayload = {
                userDto: {
                    name,
                    email: email.toLowerCase().trim(),
                    password,
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
                },
                recaptchaToken: recaptchaToken
            };

            this.http.post(`${environment.apiUrl}/auth/register`, registerPayload).subscribe({
                next: (response: any) => {
                    this.loading = false;
                    this.successMessage = 'Registration successful! You can now sign in.';
                    this.registerForm.reset();

                    setTimeout(() => {
                        this.isRegisterMode = false;
                        this.successMessage = null;
                    }, 3000);
                },
                error: (error: any) => {
                    this.loading = false;

                    if (error.error && error.error.error) {
                        this.emailValidationError = error.error.error;
                        this.errorMessage = error.error.message || 'Invalid email address';
                    } else if (error.status === 400) {
                        this.errorMessage = error.error?.message || 'Email already exists.';
                    } else if (error.status === 500) {
                        this.errorMessage = 'Server error. Please try again later.';
                    } else {
                        this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
                    }
                }
            });
        } catch (error) {
            this.loading = false;
            this.errorMessage = 'reCAPTCHA verification failed. Please try again.';
        }
    }

    private getRecaptchaToken(): Promise<string> {
        return new Promise((resolve, reject) => {
            const grecaptcha = (window as any).grecaptcha;

            if (!grecaptcha) {
                reject('reCAPTCHA not loaded');
                return;
            }

            grecaptcha.execute(environment.recaptchaSiteKey, { action: 'register' })
                .then((token: string) => {
                    resolve(token);
                })
                .catch((error: any) => {
                    reject(error);
                });
        });
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

    get registerPassword() {
        return this.registerForm.get('password');
    }
}
