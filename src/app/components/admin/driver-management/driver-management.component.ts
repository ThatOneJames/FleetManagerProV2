import { Component, OnInit } from '@angular/core';
import { DriverService } from '../../../services/driver.service';
import { User, UserStatus, UserRole } from '../../../models/user.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
    selector: 'app-driver-management',
    templateUrl: './driver-management.component.html',
    styleUrls: ['./driver-management.component.css']
})
export class DriverManagementComponent implements OnInit {
    drivers: User[] = [];
    searchText: string = '';
    filterStatus: string = 'All';

    // Form states
    showAddDriverForm: boolean = false;
    showEditDriverForm: boolean = false;
    showDeleteConfirm: boolean = false;

    // Forms
    registrationForm!: FormGroup;
    editForm!: FormGroup;

    // Current editing/deleting driver
    editingDriver: User | null = null;
    driverToDelete: User | null = null;

    // Messages
    errorMessage: string | null = null;
    successMessage: string | null = null;

    private readonly apiUrl = 'http://localhost:5129/api';

    constructor(
        private driverService: DriverService,
        private fb: FormBuilder,
        private http: HttpClient
    ) {
        this.initializeForms();
    }

    ngOnInit(): void {
        this.loadDrivers();
    }

    private initializeForms(): void {
        // Registration form for adding new drivers
        this.registrationForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            phone: [''],
            address: [''],
            dateOfBirth: [''],
            emergencyContact: [''],
            licenseNumber: [''],
            licenseClass: [''],
            licenseExpiry: [''],
            experienceYears: [0, [Validators.min(0)]],
            safetyRating: [0, [Validators.min(0), Validators.max(5)]]
        });

        // Edit form for updating existing drivers
        this.editForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            phone: [''],
            address: [''],
            dateOfBirth: [''],
            emergencyContact: [''],
            status: ['Active', Validators.required],
            licenseNumber: [''],
            licenseClass: [''],
            licenseExpiry: [''],
            experienceYears: [0, [Validators.min(0)]],
            safetyRating: [0, [Validators.min(0), Validators.max(5)]],
            totalMilesDriven: [0, [Validators.min(0)]],
            isAvailable: [true],
            hasHelper: [false]
        });
    }

    loadDrivers(): void {
        this.driverService.getAllDrivers().subscribe({
            next: (data: User[]) => {
                console.log('Raw driver data from API:', data); // Debug log
                this.drivers = data;
                console.log('Drivers assigned to component:', this.drivers); // Debug log
                this.clearMessages();
            },
            error: (err) => {
                console.error('Error loading drivers:', err); // Debug log
                this.errorMessage = 'Failed to load drivers. Please try again.';
            }
        });
    }

    get filteredDrivers(): User[] {
        console.log('All drivers:', this.drivers); // Debug log
        console.log('Filter status:', this.filterStatus); // Debug log
        console.log('Search text:', this.searchText); // Debug log

        return this.drivers.filter(driver => {
            // Status filter - convert both to strings for comparison
            const driverStatusString = typeof driver.status === 'string' ? driver.status : this.getStringStatus(driver.status);
            const matchesStatus = this.filterStatus === 'All' || driverStatusString === this.filterStatus;

            // Search filter
            const searchLower = this.searchText.toLowerCase();
            const matchesSearch = !this.searchText ||
                driver.name?.toLowerCase().includes(searchLower) ||
                driver.email?.toLowerCase().includes(searchLower) ||
                driver.licenseNumber?.toLowerCase().includes(searchLower);

            console.log(`Driver ${driver.name}: Status match=${matchesStatus}, Search match=${matchesSearch}`); // Debug log

            return matchesStatus && matchesSearch;
        });
    }

    // Status helper methods
    getNumericStatus(status: string): UserStatus | undefined {
        switch (status.toLowerCase()) {
            case 'active':
                return UserStatus.Active;
            case 'inactive':
                return UserStatus.Inactive;
            case 'suspended':
                return UserStatus.Suspended;
            default:
                return undefined;
        }
    }

    getStringStatus(status: UserStatus | string): string {
        if (typeof status === 'string') {
            return status; // Already a string, return as-is
        }

        switch (status) {
            case UserStatus.Active:
                return 'Active';
            case UserStatus.Inactive:
                return 'Inactive';
            case UserStatus.Suspended:
                return 'Suspended';
            default:
                return 'Unknown';
        }
    }

    // Add Driver Methods
    toggleAddDriverForm(): void {
        this.showAddDriverForm = !this.showAddDriverForm;
        if (this.showAddDriverForm) {
            this.registrationForm.reset();
            this.clearMessages();
        }
    }

    addDriver(): void {
        if (this.registrationForm.invalid) {
            this.markFormGroupTouched(this.registrationForm);
            this.errorMessage = 'Please fill out all required fields correctly.';
            return;
        }

        this.clearMessages();
        const formData = this.registrationForm.value;

        // Prepare the data for API
        const userDto = {
            ...formData,
            role: 'Driver',
            status: 'Active',
            isAvailable: true,
            hasHelper: false,
            // Convert empty strings to null for optional fields
            phone: formData.phone || null,
            address: formData.address || null,
            emergencyContact: formData.emergencyContact || null,
            licenseNumber: formData.licenseNumber || null,
            licenseClass: formData.licenseClass || null,
            licenseExpiry: formData.licenseExpiry || null,
            dateOfBirth: formData.dateOfBirth || null
        };

        this.http.post(`${this.apiUrl}/auth/register`, userDto).subscribe({
            next: (response: any) => {
                this.successMessage = 'Driver added successfully!';
                this.loadDrivers();
                this.registrationForm.reset();
                this.showAddDriverForm = false;
                this.hideMessages();
            },
            error: (err: any) => {
                this.errorMessage = err.error?.message || 'Failed to add driver. Please try again.';
                console.error('Error adding driver:', err);
            }
        });
    }

    // Edit Driver Methods
    editDriver(driver: User): void {
        this.editingDriver = driver;
        this.showEditDriverForm = true;
        this.clearMessages();

        // Populate the edit form with current driver data
        this.editForm.patchValue({
            name: driver.name || '',
            email: driver.email || '',
            phone: driver.phone || '',
            address: driver.address || '',
            dateOfBirth: driver.dateOfBirth ? this.formatDate(driver.dateOfBirth) : '',
            emergencyContact: driver.emergencyContact || '',
            status: this.getStringStatus(driver.status),
            licenseNumber: driver.licenseNumber || '',
            licenseClass: driver.licenseClass || '',
            licenseExpiry: driver.licenseExpiry ? this.formatDate(driver.licenseExpiry) : '',
            experienceYears: driver.experienceYears || 0,
            safetyRating: driver.safetyRating || 0,
            totalMilesDriven: driver.totalMilesDriven || 0,
            isAvailable: driver.isAvailable ?? true,
            hasHelper: driver.hasHelper ?? false
        });
    }

    updateDriver(): void {
        if (this.editForm.invalid || !this.editingDriver) {
            this.markFormGroupTouched(this.editForm);
            this.errorMessage = 'Please fill out all required fields correctly.';
            return;
        }

        this.clearMessages();
        const formData = this.editForm.value;

        // Prepare the update data
        const updateData = {
            ...formData,
            status: this.getNumericStatus(formData.status),
            // Convert empty strings to null for optional fields
            phone: formData.phone || null,
            address: formData.address || null,
            emergencyContact: formData.emergencyContact || null,
            licenseNumber: formData.licenseNumber || null,
            licenseClass: formData.licenseClass || null,
            licenseExpiry: formData.licenseExpiry || null,
            dateOfBirth: formData.dateOfBirth || null
        };

        this.http.put(`${this.apiUrl}/users/${this.editingDriver.id}`, updateData).subscribe({
            next: (response: any) => {
                this.successMessage = 'Driver updated successfully!';
                this.loadDrivers();
                this.cancelEdit();
                this.hideMessages();
            },
            error: (err: any) => {
                this.errorMessage = err.error?.message || 'Failed to update driver. Please try again.';
                console.error('Error updating driver:', err);
            }
        });
    }

    cancelEdit(): void {
        this.showEditDriverForm = false;
        this.editingDriver = null;
        this.editForm.reset();
        this.clearMessages();
    }

    // Delete Driver Methods
    confirmDelete(driver: User): void {
        this.driverToDelete = driver;
        this.showDeleteConfirm = true;
        this.clearMessages();
    }

    deleteDriver(): void {
        if (!this.driverToDelete?.id) return;

        this.http.delete(`${this.apiUrl}/users/${this.driverToDelete.id}`).subscribe({
            next: () => {
                this.successMessage = `Driver ${this.driverToDelete?.name} deleted successfully!`;
                this.loadDrivers();
                this.cancelDelete();
                this.hideMessages();
            },
            error: (err: any) => {
                this.errorMessage = err.error?.message || 'Failed to delete driver. Please try again.';
                this.cancelDelete();
                console.error('Error deleting driver:', err);
            }
        });
    }

    cancelDelete(): void {
        this.showDeleteConfirm = false;
        this.driverToDelete = null;
    }

    // Form Helper Methods
    cancelForm(): void {
        this.showAddDriverForm = false;
        this.registrationForm.reset();
        this.clearMessages();
    }

    private markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach(field => {
            const control = formGroup.get(field);
            control?.markAsTouched({ onlySelf: true });
        });
    }

    private formatDate(dateString: string | Date): string {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
    }

    // Message Management
    private clearMessages(): void {
        this.errorMessage = null;
        this.successMessage = null;
    }

    private hideMessages(): void {
        setTimeout(() => {
            this.clearMessages();
        }, 5000); // Hide messages after 5 seconds
    }

    // Additional utility methods for enhanced functionality

    // Quick status toggle methods
    toggleDriverAvailability(driver: User): void {
        const updateData = {
            ...driver,
            isAvailable: !driver.isAvailable
        };

        this.http.put(`${this.apiUrl}/users/${driver.id}`, updateData).subscribe({
            next: () => {
                driver.isAvailable = !driver.isAvailable;
                this.successMessage = `Driver availability updated successfully!`;
                this.hideMessages();
            },
            error: (err: any) => {
                this.errorMessage = 'Failed to update driver availability.';
                console.error('Error updating availability:', err);
            }
        });
    }

    // Export drivers data (optional feature)
    exportDrivers(): void {
        const csvData = this.convertToCSV(this.filteredDrivers);
        this.downloadCSV(csvData, 'drivers_export.csv');
    }

    private convertToCSV(data: User[]): string {
        const headers = [
            'Name', 'Email', 'Phone', 'Status', 'License Number', 'License Class',
            'Experience Years', 'Safety Rating', 'Total Miles', 'Available', 'Has Helper'
        ];

        const rows = data.map(driver => [
            driver.name || '',
            driver.email || '',
            driver.phone || '',
            this.getStringStatus(driver.status),
            driver.licenseNumber || '',
            driver.licenseClass || '',
            driver.experienceYears || 0,
            driver.safetyRating || 0,
            driver.totalMilesDriven || 0,
            driver.isAvailable ? 'Yes' : 'No',
            driver.hasHelper ? 'Yes' : 'No'
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        return csvContent;
    }

    private downloadCSV(csvContent: string, filename: string): void {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // Bulk operations (for future enhancement)
    selectAll(): void {
        // Implementation for selecting all drivers for bulk operations
    }

    bulkStatusUpdate(newStatus: string): void {
        // Implementation for bulk status updates
    }

    // Search and filter reset
    resetFilters(): void {
        this.searchText = '';
        this.filterStatus = 'All';
        this.clearMessages();
    }

    // Validation helper for license expiry warning
    isLicenseExpiringSoon(driver: User): boolean {
        if (!driver.licenseExpiry) return false;

        const expiryDate = new Date(driver.licenseExpiry);
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        return expiryDate <= thirtyDaysFromNow && expiryDate >= today;
    }

    isLicenseExpired(driver: User): boolean {
        if (!driver.licenseExpiry) return false;

        const expiryDate = new Date(driver.licenseExpiry);
        const today = new Date();

        return expiryDate < today;
    }
}