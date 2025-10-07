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

    // Read-only fields
    hireDate: string = '';
    safetyRating: number = 0;
    totalMilesDriven: number = 0;
    status: string = '';
    role: string = '';
    driverId: string = '';
    joinedDate: string = '';

    // ✅ TRUCK-RELATED LICENSE CLASSES (Philippines)
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
            phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,11}$/)]],
            address: [''],
            dateOfBirth: [''],
            emergencyContact: ['', [Validators.required]],
            licenseNumber: ['', [Validators.required]],
            licenseClasses: this.fb.array([], Validators.required), // ✅ FormArray for multiple checkboxes
            licenseExpiry: ['', [Validators.required]],
            experienceYears: [0, [Validators.min(0), Validators.max(50)]]
        });
    }

    // ✅ FORM CONTROL GETTERS (Required for HTML validation)
    get name() {
        return this.profileForm.get('name');
    }

    get email() {
        return this.profileForm.get('email');
    }

    get phone() {
        return this.profileForm.get('phone');
    }

    get address() {
        return this.profileForm.get('address');
    }

    get dateOfBirth() {
        return this.profileForm.get('dateOfBirth');
    }

    get emergencyContact() {
        return this.profileForm.get('emergencyContact');
    }

    get licenseNumber() {
        return this.profileForm.get('licenseNumber');
    }

    get licenseExpiry() {
        return this.profileForm.get('licenseExpiry');
    }

    get experienceYears() {
        return this.profileForm.get('experienceYears');
    }

    // ✅ Getter for license classes FormArray
    get licenseClassesFormArray(): FormArray {
        return this.profileForm.get('licenseClasses') as FormArray;
    }

    // ✅ BACKWARD COMPATIBILITY: For old HTML that uses licenseClasses
    get licenseClasses() {
        return this.availableLicenseClasses;
    }

    // ✅ Check if a license class is selected
    isLicenseClassSelected(code: string): boolean {
        return this.licenseClassesFormArray.value.includes(code);
    }

    // ✅ Toggle license class checkbox
    onLicenseClassChange(code: string, event: any): void {
        const formArray = this.licenseClassesFormArray;

        if (event.target.checked) {
            formArray.push(new FormControl(code));
        } else {
            const index = formArray.controls.findIndex(x => x.value === code);
            if (index >= 0) {
                formArray.removeAt(index);
            }
        }
    }

    private loadCurrentUserProfile(): void {
        this.isLoading = true;
        this.clearMessages();

        this.authService.currentUser$.subscribe({
            next: (user) => {
                if (user && user.id) {
                    console.log('✅ User loaded from AuthService:', user);
                    this.populateForm(user);
                    this.isLoading = false;
                } else {
                    console.log('⚠️ User not in AuthService, fetching from API');
                    this.fetchUserFromApi();
                }
            },
            error: (err) => {
                console.error('❌ Error loading user from AuthService:', err);
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

        this.http.get<any>(`${this.apiUrl}/current`, { headers }).subscribe({
            next: (response) => {
                console.log('✅ User loaded from API:', response);
                this.populateForm(response);
                this.isLoading = false;
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
            licenseExpiry: user.licenseExpiry,
            licenseClass: user.licenseClass,
            licenseNumber: user.licenseNumber
        });

        this.currentUser = user;
        this.driverId = `Driver ID: ${user.id ? user.id.substring(0, 8) : '2'}`;

        // ✅ Parse license classes (stored as "B1,B2,C")
        const licenseClasses = user.licenseClass ? user.licenseClass.split(',') : [];

        // Clear and rebuild FormArray
        this.licenseClassesFormArray.clear();
        licenseClasses.forEach((code: string) => {
            this.licenseClassesFormArray.push(new FormControl(code.trim()));
        });

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
        });

        console.log('✅ Form populated with values:', {
            ...this.profileForm.value,
            licenseClasses: this.licenseClassesFormArray.value
        });
        console.log('📅 License Expiry after formatting:', this.profileForm.get('licenseExpiry')?.value);

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
        if (!dateString) {
            console.log('📅 No date to format');
            return '';
        }

        try {
            const date = new Date(dateString);
            const formatted = date.toISOString().split('T')[0];
            console.log(`📅 Formatted date: ${dateString} => ${formatted}`);
            return formatted;
        } catch (error) {
            console.error('❌ Error formatting date:', error);
            return '';
        }
    }

    private formatDisplayDate(dateString: string | Date): string {
        if (!dateString) return '';
        const date = new Date(dateString);
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    }

    toggleEdit(): void {
        this.isEditing = !this.isEditing;
        if (!this.isEditing && this.currentUser) {
            this.populateForm(this.currentUser);
        }
        this.clearMessages();
    }

    saveChanges(): void {
        if (this.profileForm.invalid) {
            this.markFormGroupTouched(this.profileForm);
            this.errorMessage = 'Please fill out all required fields correctly.';
            return;
        }

        // ✅ Validate at least one license class selected
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

        // ✅ Convert license classes array to comma-separated string
        const licenseClassString = this.licenseClassesFormArray.value.join(',');

        const updatePayload = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone || null,
            address: formData.address || null,
            emergencyContact: formData.emergencyContact || null,
            licenseNumber: formData.licenseNumber || null,
            licenseClass: licenseClassString, // ✅ "B1,B2,C"
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
                    this.populateForm(response);
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

    // Helper to get rating stars
    getRatingStars(rating: number): string {
        if (!rating) return '';
        return '⭐'.repeat(Math.round(rating));
    }

    // Helper to format miles
    formatMiles(miles: number): string {
        return miles ? miles.toLocaleString() : '0';
    }
}
