import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { environment } from '../../../../environments/environment';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';

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

    hireDate: string = '';
    safetyRating: number = 0;
    totalMilesDriven: number = 0;
    status: string = '';
    role: string = '';
    driverId: string = '';
    joinedDate: string = '';

    availableLicenseClasses = [
        { code: 'B1', name: 'Light Trucks (Up to 4,500 kg)' },
        { code: 'B2', name: 'Heavy Trucks (Over 4,500 kg)' },
        { code: 'C', name: 'Trucks with Trailer' },
        { code: 'CE', name: 'Articulated Trucks' }
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
            licenseNumber: ['', [Validators.required]],
            licenseClasses: this.fb.array([], Validators.required),
            licenseExpiry: ['', [Validators.required]],
            experienceYears: [0, [Validators.min(0), Validators.max(50)]]
        });
    }

    get name() { return this.profileForm.get('name'); }
    get email() { return this.profileForm.get('email'); }
    get phone() { return this.profileForm.get('phone'); }
    get address() { return this.profileForm.get('address'); }
    get dateOfBirth() { return this.profileForm.get('dateOfBirth'); }
    get emergencyContact() { return this.profileForm.get('emergencyContact'); }
    get licenseNumber() { return this.profileForm.get('licenseNumber'); }
    get licenseExpiry() { return this.profileForm.get('licenseExpiry'); }
    get experienceYears() { return this.profileForm.get('experienceYears'); }

    get licenseClassesFormArray(): FormArray {
        return this.profileForm.get('licenseClasses') as FormArray;
    }

    get licenseClasses() {
        return this.availableLicenseClasses;
    }

    isLicenseClassSelected(code: string): boolean {
        return this.licenseClassesFormArray.value.includes(code);
    }

    onLicenseClassChange(code: string, event: any): void {
        const formArray = this.licenseClassesFormArray;
        const isChecked = event.checked;

        if (isChecked) {
            if (!formArray.value.includes(code)) {
                formArray.push(new FormControl(code));
            }
        } else {
            const index = formArray.controls.findIndex(x => x.value === code);
            if (index >= 0) {
                formArray.removeAt(index);
            }
        }

        formArray.markAsTouched();
        console.log('✅ License classes updated:', formArray.value);
    }

    // ✅ FIXED: ALWAYS LOAD FRESH DATA FROM API
    private loadCurrentUserProfile(): void {
        this.isLoading = true;
        this.clearMessages();

        const token = this.authService.getToken();
        if (!token) {
            this.errorMessage = 'Not authenticated. Please log in.';
            this.isLoading = false;
            return;
        }

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });

        // ✅ Always fetch from API, don't use cached currentUser$
        console.log('📡 Fetching fresh user data from API...');

        this.http.get<any>(`${this.apiUrl}/current`, { headers }).subscribe({
            next: (response) => {
                console.log('✅ Fresh user data from /current:', response);

                // If license data is missing, fetch full details
                if (!response.licenseClass && response.id) {
                    console.log('⚠️ License class missing, fetching full details...');
                    this.http.get<any>(`${this.apiUrl}/${response.id}`, { headers }).subscribe({
                        next: (fullUser) => {
                            console.log('✅ Full user details loaded:', fullUser);
                            this.populateForm(fullUser);
                            this.isLoading = false;
                        },
                        error: (err) => {
                            console.error('❌ Error loading full user:', err);
                            this.populateForm(response);
                            this.isLoading = false;
                        }
                    });
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

    private populateForm(user: any): void {
        console.log('📝 Populating form with user data:', {
            id: user.id,
            name: user.name,
            licenseClass: user.licenseClass
        });

        this.currentUser = user;
        this.driverId = `Driver ID: ${user.id || 'N/A'}`;

        // ✅ Parse license classes from comma-separated string
        const licenseClassString = user.licenseClass || '';
        const licenseClasses = licenseClassString
            .split(',')
            .map((c: string) => c.trim())
            .filter((c: string) => c.length > 0);

        console.log('✅ Parsed license classes:', licenseClasses);

        // ✅ Clear and rebuild FormArray
        this.licenseClassesFormArray.clear();
        licenseClasses.forEach((code: string) => {
            this.licenseClassesFormArray.push(new FormControl(code));
        });

        // ✅ Patch form values
        this.profileForm.patchValue({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            address: user.address || '',
            dateOfBirth: user.dateOfBirth ? this.formatDate(user.dateOfBirth) : '',
            emergencyContact: user.emergencyContact || '',
            licenseNumber: user.licenseNumber || '',
            licenseExpiry: user.licenseExpiry ? this.formatDate(user.licenseExpiry) : '',
            experienceYears: user.experienceYears || 0
        }, { emitEvent: false });

        console.log('✅ Form populated. License classes in FormArray:', this.licenseClassesFormArray.value);

        // Set read-only fields
        this.hireDate = user.hireDate ? this.formatDisplayDate(user.hireDate) : user.createdAt ? this.formatDisplayDate(user.createdAt) : '6/15/2023';
        this.joinedDate = user.createdAt ? this.formatDisplayDate(user.createdAt) : user.hireDate ? this.formatDisplayDate(user.hireDate) : '6/15/2023';
        this.safetyRating = user.safetyRating || 0;
        this.totalMilesDriven = user.totalMilesDriven || 0;
        this.status = user.status || 'Active';
        this.role = user.role || 'Driver';

        this.isLoading = false;
    }

    private formatDate(dateString: string | Date): string {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            return date.toISOString().split('T')[0];
        } catch (error) {
            return '';
        }
    }

    private formatDisplayDate(dateString: string | Date): string {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
        } catch (error) {
            return '';
        }
    }

    toggleEdit(): void {
        this.isEditing = !this.isEditing;
        if (!this.isEditing && this.currentUser) {
            this.populateForm(this.currentUser);
        }
        this.clearMessages();
    }

    saveChanges(): void {
        this.markFormGroupTouched(this.profileForm);

        if (this.profileForm.invalid) {
            this.errorMessage = 'Please fill out all required fields correctly.';
            console.log('❌ Form invalid');
            Object.keys(this.profileForm.controls).forEach(key => {
                const control = this.profileForm.get(key);
                if (control?.invalid) {
                    console.log(`❌ ${key} is invalid:`, control.errors);
                }
            });
            return;
        }

        if (this.licenseClassesFormArray.length === 0) {
            this.errorMessage = 'Please select at least one license class.';
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
        const licenseClassString = this.licenseClassesFormArray.value.join(',');

        const updatePayload = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone || null,
            address: formData.address || null,
            emergencyContact: formData.emergencyContact || null,
            licenseNumber: formData.licenseNumber || null,
            licenseClass: licenseClassString,
            licenseExpiry: formData.licenseExpiry || null,
            dateOfBirth: formData.dateOfBirth || null,
            experienceYears: formData.experienceYears || 0
        };

        console.log('💾 Saving profile with payload:', updatePayload);

        const token = this.authService.getToken();
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        });

        this.http.put<any>(`${this.apiUrl}/${userId}`, updatePayload, { headers })
            .subscribe({
                next: (response) => {
                    console.log('✅ Profile updated successfully:', response);
                    this.successMessage = 'Profile updated successfully!';
                    this.isEditing = false;
                    this.isLoading = false;

                    // ✅ Reload fresh data from API after save
                    this.loadCurrentUserProfile();

                    this.hideMessages();
                },
                error: (err) => {
                    this.isLoading = false;
                    this.errorMessage = err.error?.message || 'Error updating profile. Please try again.';
                    console.error('❌ Error updating profile:', err);
                }
            });
    }

    private markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach(field => {
            const control = formGroup.get(field);
            control?.markAsTouched({ onlySelf: true });

            if (control instanceof FormArray) {
                control.controls.forEach(c => c.markAsTouched());
            }
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
        if (!rating) return '';
        return '⭐'.repeat(Math.round(rating));
    }

    formatMiles(miles: number): string {
        return miles ? miles.toLocaleString() : '0';
    }
}
