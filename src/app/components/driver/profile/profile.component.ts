import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-driver-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css']
})
export class DriverProfileComponent implements OnInit {
    isEditing = false;
    isLoading = false;
    errorMessage: string | null = null;
    successMessage: string | null = null;

    profileForm!: FormGroup;
    currentUser: any = null;

    // Read-only fields to display
    hireDate: string = '';
    safetyRating: number = 0;
    totalMilesDriven: number = 0;
    status: string = '';
    role: string = '';

    // License classes dropdown options (MATCH ADMIN EXACTLY)
    licenseClasses: string[] = [
        'Class A',
        'Class B',
        'Class C',
        'CDL'
    ];

    private readonly apiUrl = `${environment.apiUrl}/users`;

    constructor(
        private http: HttpClient,
        private authService: AuthService,
        private fb: FormBuilder
    ) {
        this.initializeForm();
    }

    ngOnInit(): void {
        this.loadCurrentUserProfile();
    }

    private initializeForm(): void {
        this.profileForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            phone: [''],
            address: [''],
            dateOfBirth: [''],
            emergencyContact: [''],
            licenseNumber: [''],
            licenseClass: [''],
            licenseExpiry: [''],
            experienceYears: [0, [Validators.min(0), Validators.max(50)]]
        });
    }

    private loadCurrentUserProfile(): void {
        this.isLoading = true;
        this.clearMessages();

        // Subscribe to the currentUser$ observable
        this.authService.currentUser$.subscribe({
            next: (user) => {
                if (user && user.id) {
                    console.log('✅ User loaded from AuthService:', user);
                    this.populateForm(user);
                    this.isLoading = false;
                } else {
                    // Fallback: Fetch from API
                    this.fetchUserFromApi();
                }
            },
            error: (err) => {
                console.error('❌ Error from currentUser$:', err);
                this.fetchUserFromApi();
            }
        });
    }

    private fetchUserFromApi(): void {
        const token = this.authService.getToken();

        if (!token) {
            this.errorMessage = 'Not authenticated. Please log in.';
            this.isLoading = false;
            return;
        }

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });

        // FIRST: Try /api/users/current
        this.http.get<any>(`${this.apiUrl}/current`, { headers }).subscribe({
            next: (response) => {
                console.log('✅ User loaded from /current:', response);

                // If licenseExpiry is missing, fetch full user details
                if (!response.licenseExpiry && response.id) {
                    console.log('⚠️ licenseExpiry missing, fetching from /users/{id}');
                    this.fetchFullUserDetails(response.id, headers);
                } else {
                    this.populateForm(response);
                    this.isLoading = false;
                }
            },
            error: (err) => {
                console.error('❌ Error loading user from API:', err);
                this.errorMessage = 'Could not load profile data';
                this.isLoading = false;

                if (err.status === 401) {
                    this.authService.logout();
                }
            }
        });
    }

    // NEW METHOD: Fetch full user details
    private fetchFullUserDetails(userId: string, headers: HttpHeaders): void {
        this.http.get<any>(`${this.apiUrl}/${userId}`, { headers }).subscribe({
            next: (fullUser) => {
                console.log('✅ Full user loaded from /users/{id}:', fullUser);
                this.populateForm(fullUser);
                this.isLoading = false;
            },
            error: (err) => {
                console.error('❌ Error loading full user details:', err);
                this.errorMessage = 'Could not load complete profile data';
                this.isLoading = false;
            }
        });
    }


    private populateForm(user: any): void {
        this.currentUser = user;

        console.log('📝 Populating form with user data:', {
            licenseExpiry: user.licenseExpiry,
            licenseClass: user.licenseClass,
            licenseNumber: user.licenseNumber
        });

        // Populate editable fields
        this.profileForm.patchValue({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            address: user.address || '',
            dateOfBirth: user.dateOfBirth ? this.formatDate(user.dateOfBirth) : '',
            emergencyContact: user.emergencyContact || '',
            licenseNumber: user.licenseNumber || user.driver?.licenseNumber || '',
            licenseClass: user.licenseClass || user.driver?.licenseClass || '',
            licenseExpiry: user.licenseExpiry ? this.formatDate(user.licenseExpiry) : '',
            experienceYears: user.experienceYears || user.driver?.experienceYears || 0
        });

        // Set read-only fields
        this.hireDate = user.hireDate ? this.formatDate(user.hireDate) : 'N/A';
        this.safetyRating = user.safetyRating || user.driver?.safetyRating || 0;
        this.totalMilesDriven = user.totalMilesDriven || user.driver?.totalMilesDriven || 0;
        this.status = user.status || 'Active';
        this.role = user.role || 'Driver';

        console.log('✅ Form populated with values:', this.profileForm.value);
        console.log('📅 License Expiry after formatting:', this.profileForm.get('licenseExpiry')?.value);
    }

    // SAME formatDate as driver-management
    private formatDate(dateString: string | Date): string {
        if (!dateString) return '';

        try {
            const date = new Date(dateString);

            // Check if date is valid
            if (isNaN(date.getTime())) {
                console.warn('⚠️ Invalid date:', dateString);
                return '';
            }

            const formatted = date.toISOString().split('T')[0];
            console.log(`📅 Formatted date: ${dateString} => ${formatted}`);
            return formatted;
        } catch (error) {
            console.error('❌ Error formatting date:', error);
            return '';
        }
    }

    toggleEdit(): void {
        this.isEditing = !this.isEditing;
        if (!this.isEditing) {
            // Reset form when canceling
            if (this.currentUser) {
                this.populateForm(this.currentUser);
            }
        }
        this.clearMessages();
    }

    saveChanges(): void {
        if (this.profileForm.invalid) {
            this.markFormGroupTouched(this.profileForm);
            this.errorMessage = 'Please fill out all required fields correctly.';
            return;
        }

        const userId = this.currentUser?.id;
        if (!userId) {
            this.errorMessage = 'User ID is missing. Cannot update profile.';
            return;
        }

        this.clearMessages();
        this.isLoading = true;

        const formData = this.profileForm.value;

        // SAME payload structure as driver-management updateDriver()
        const updatePayload = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone || null,
            address: formData.address || null,
            emergencyContact: formData.emergencyContact || null,
            licenseNumber: formData.licenseNumber || null,
            licenseClass: formData.licenseClass || null,
            licenseExpiry: formData.licenseExpiry || null,
            dateOfBirth: formData.dateOfBirth || null,
            experienceYears: formData.experienceYears || 0
        };

        console.log('🚀 Sending update payload:', updatePayload);

        const token = this.authService.getToken();
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        });

        this.http.put<any>(`${this.apiUrl}/${userId}`, updatePayload, { headers })
            .subscribe({
                next: (response) => {
                    console.log('✅ Update successful:', response);
                    this.successMessage = 'Profile updated successfully!';
                    this.isEditing = false;
                    this.isLoading = false;

                    // Update current user data
                    this.populateForm(response);

                    // Hide success message after 5 seconds
                    this.hideMessages();
                },
                error: (err) => {
                    this.isLoading = false;
                    console.error('❌ Error updating profile:', err);

                    if (err.status === 404) {
                        this.errorMessage = 'User not found. Please log in again.';
                    } else if (err.status === 401) {
                        this.errorMessage = 'Session expired. Please log in again.';
                        setTimeout(() => this.authService.logout(), 2000);
                    } else if (err.status === 400) {
                        this.errorMessage = err.error?.message || 'Invalid data. Please check your input.';
                    } else {
                        this.errorMessage = 'Error updating profile. Please try again.';
                    }
                }
            });
    }

    private markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach(field => {
            const control = formGroup.get(field);
            control?.markAsTouched({ onlySelf: true });
        });
    }

    private clearMessages(): void {
        this.errorMessage = null;
        this.successMessage = null;
    }

    private hideMessages(): void {
        setTimeout(() => {
            this.clearMessages();
        }, 5000);
    }

    getRatingStars(rating: number): string {
        if (!rating) return 'N/A';
        return '⭐'.repeat(Math.round(rating)) + ` (${rating.toFixed(1)})`;
    }

    formatMileage(miles: number): string {
        if (!miles) return '0 miles';
        return miles.toLocaleString() + ' miles';
    }

    // Form getters for validation messages
    get name() { return this.profileForm.get('name'); }
    get email() { return this.profileForm.get('email'); }
    get phone() { return this.profileForm.get('phone'); }
    get experienceYears() { return this.profileForm.get('experienceYears'); }
}
