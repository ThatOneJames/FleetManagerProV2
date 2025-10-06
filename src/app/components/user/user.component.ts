import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-user',
    templateUrl: './user.component.html',
    styleUrls: ['./user.component.css']
})
export class UserComponent {
    registrationForm: FormGroup;
    roles: string[] = ['Driver', 'Admin'];
    errorMessage: string | null = null;
    successMessage: string | null = null;

    constructor(private fb: FormBuilder, private http: HttpClient) {
        this.registrationForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            name: ['', Validators.required],
            role: ['Driver', Validators.required]
        });
    }

    onSubmit() {
        if (this.registrationForm.invalid) {
            return;
        }

        this.errorMessage = null;
        this.successMessage = null;

        const apiUrl = 'https://fleetmanagerprov2-production.up.railway.app/api/auth/register';
        const userDto = this.registrationForm.value;

        this.http.post(apiUrl, userDto).subscribe({
            next: (response: any) => {
                this.successMessage = response.message;
                this.registrationForm.reset({ role: 'Driver' }); // Reset form and default role
            },
            error: (err: any) => {
                this.errorMessage = err.error.message || 'Registration failed.';
            }
        });
    }
}
