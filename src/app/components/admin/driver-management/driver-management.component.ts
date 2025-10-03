import { Component, OnInit } from '@angular/core';
import { DriverService } from '../../../services/driver.service';
import { User, UserStatus, UserRole } from '../../../models/user.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
    selector: 'app-driver-management',
    templateUrl: './driver-management.component.html',
    styleUrls: ['./driver-management.component.css']
})
export class DriverManagementComponent implements OnInit {
    drivers: User[] = [];
    searchText: string = '';
    filterStatus: string = 'All';

    // Attendance tracking
    driversAttendance: Map<string, boolean> = new Map();
    driversOnLeave: Map<string, any> = new Map(); // Track leave status
    isLoadingAttendance: boolean = false;

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
                this.drivers = data;
                this.loadDriversAttendanceAndLeave(); // Load both attendance and leave status
                this.clearMessages();
            },
            error: (err) => {
                console.error('Error loading drivers:', err);
                this.errorMessage = 'Failed to load drivers. Please try again.';
            }
        });
    }

    // Load both attendance and leave status for all drivers
    private loadDriversAttendanceAndLeave(): void {
        this.isLoadingAttendance = true;
        const token = localStorage.getItem('token');

        if (!token) {
            console.error('No authentication token found');
            this.isLoadingAttendance = false;
            return;
        }

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        });

        // Create array of observables for attendance checks
        const attendanceRequests = this.drivers.map(driver =>
            this.http.get<any>(`${this.apiUrl}/attendance/driver/${driver.id}/today`, { headers }).pipe(
                catchError(error => {
                    console.log(`No attendance found for driver ${driver.name}`);
                    return of(null);
                })
            )
        );

        // Create array of observables for leave status checks
        const leaveRequests = this.drivers.map(driver =>
            this.http.get<any>(`${this.apiUrl}/leaverequests/driver/${driver.id}/active`, { headers }).pipe(
                catchError(error => {
                    return of(null);
                })
            )
        );

        // Execute all requests in parallel
        forkJoin([
            forkJoin(attendanceRequests),
            forkJoin(leaveRequests)
        ]).subscribe({
            next: ([attendanceResponses, leaveResponses]) => {
                console.log('🔍 Attendance responses:', attendanceResponses);
                console.log('🏖️ Leave responses:', leaveResponses);

                // Process attendance responses
                attendanceResponses.forEach((response, index) => {
                    const driver = this.drivers[index];

                    if (response === null) {
                        this.driversAttendance.set(driver.id!, false);
                        return;
                    }

                    let hasClockedIn = false;

                    if (response?.data) {
                        hasClockedIn = response.data.clockIn != null;
                    } else if (response?.clockIn != null) {
                        hasClockedIn = true;
                    } else if (response?.status === 'Present' || response?.data?.status === 'Present') {
                        hasClockedIn = true;
                    }

                    this.driversAttendance.set(driver.id!, hasClockedIn);
                });

                leaveResponses.forEach((response, index) => {
                    const driver = this.drivers[index];

                    if (response === null || !response) {
                        this.driversOnLeave.set(driver.id!, null);
                        return;
                    }

                    // Check if driver has active approved leave
                    let activeLeave = null;

                    // Response might be an array or single object
                    if (Array.isArray(response)) {
                        activeLeave = response.find((leave: any) =>
                            leave.status === 'Approved' && this.isLeaveActiveToday(leave)
                        );
                    } else if (response.status === 'Approved' && this.isLeaveActiveToday(response)) {
                        activeLeave = response;
                    } else if (response.data) {
                        if (Array.isArray(response.data)) {
                            activeLeave = response.data.find((leave: any) =>
                                leave.status === 'Approved' && this.isLeaveActiveToday(leave)
                            );
                        } else if (response.data.status === 'Approved' && this.isLeaveActiveToday(response.data)) {
                            activeLeave = response.data;
                        }
                    }

                    this.driversOnLeave.set(driver.id!, activeLeave);

                    if (activeLeave) {
                        console.log(`🏖️ Driver ${driver.name} is ON LEAVE:`, activeLeave);
                    }
                });

                this.isLoadingAttendance = false;
            },
            error: (error) => {
                console.error('❌ Error loading data:', error);
                this.drivers.forEach(driver => {
                    this.driversAttendance.set(driver.id!, false);
                    this.driversOnLeave.set(driver.id!, null);
                });
                this.isLoadingAttendance = false;
            }
        });
    }

    // Check if leave is active today
    private isLeaveActiveToday(leave: any): boolean {
        if (!leave || !leave.startDate || !leave.endDate) return false;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startDate = new Date(leave.startDate);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(leave.endDate);
        endDate.setHours(0, 0, 0, 0);

        return today >= startDate && today <= endDate;
    }

    // Check if driver is on leave
    isDriverOnLeave(driverId: string): boolean {
        const leave = this.driversOnLeave.get(driverId);
        return leave !== null && leave !== undefined;
    }

    // Get leave type
    getDriverLeaveType(driverId: string): string {
        const leave = this.driversOnLeave.get(driverId);
        if (!leave) return '';
        return leave.leaveType || leave.type || '';
    }

    // Check if driver has clocked in today
    hasDriverClockedInToday(driverId: string): boolean {
        return this.driversAttendance.get(driverId) ?? false;
    }

    // Get availability status text - UPDATED
    getAvailabilityText(driverId: string): string {
        if (this.isDriverOnLeave(driverId)) {
            return 'On Leave';
        }
        return this.hasDriverClockedInToday(driverId) ? 'Available' : 'Unavailable';
    }

    // Get availability subtitle - UPDATED
    getAvailabilitySubtitle(driverId: string): string {
        if (this.isDriverOnLeave(driverId)) {
            const leaveType = this.getDriverLeaveType(driverId);
            return leaveType ? `${leaveType} Leave` : 'On Leave';
        }
        return this.hasDriverClockedInToday(driverId) ? 'Clocked In' : 'Not Clocked In';
    }

    // Get availability CSS class - UPDATED
    getAvailabilityClass(driverId: string): string {
        if (this.isDriverOnLeave(driverId)) {
            return 'on-leave';
        }
        return this.hasDriverClockedInToday(driverId) ? 'clocked-in' : 'not-clocked-in';
    }

    get filteredDrivers(): User[] {
        return this.drivers.filter(driver => {
            const matchesStatus = this.filterStatus === 'All' || driver.status === this.filterStatus;
            const searchLower = this.searchText.toLowerCase();
            const matchesSearch = !this.searchText ||
                driver.name?.toLowerCase().includes(searchLower) ||
                driver.email?.toLowerCase().includes(searchLower) ||
                driver.licenseNumber?.toLowerCase().includes(searchLower);

            return matchesStatus && matchesSearch;
        });
    }

    getNumericStatus(status: string): UserStatus | undefined {
        switch (status.toLowerCase()) {
            case 'active': return UserStatus.Active;
            case 'inactive': return UserStatus.Inactive;
            case 'suspended': return UserStatus.Suspended;
            default: return undefined;
        }
    }

    getStringStatus(status: string): string {
        return status;
    }

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

        const userDto = {
            ...formData,
            role: 'Driver',
            status: 'Active',
            isAvailable: true,
            hasHelper: false,
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

    editDriver(driver: User): void {
        this.editingDriver = driver;
        this.showEditDriverForm = true;
        this.clearMessages();

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

        const updateData = {
            ...formData,
            status: formData.status,
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
        return date.toISOString().split('T')[0];
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

    exportDrivers(): void {
        const csvData = this.convertToCSV(this.filteredDrivers);
        this.downloadCSV(csvData, 'drivers_export.csv');
    }

    private convertToCSV(data: User[]): string {
        const headers = [
            'Name', 'Email', 'Phone', 'Status', 'License Number', 'License Class',
            'Experience Years', 'Safety Rating', 'Total Miles', 'Available', 'Has Helper', 'Clocked In', 'On Leave'
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
            driver.hasHelper ? 'Yes' : 'No',
            this.hasDriverClockedInToday(driver.id!) ? 'Yes' : 'No',
            this.isDriverOnLeave(driver.id!) ? 'Yes' : 'No'
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

    selectAll(): void {
        // Implementation for selecting all drivers for bulk operations
    }

    bulkStatusUpdate(newStatus: string): void {
        // Implementation for bulk status updates
    }

    resetFilters(): void {
        this.searchText = '';
        this.filterStatus = 'All';
        this.clearMessages();
    }

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

    // Refresh attendance and leave data
    refreshAttendance(): void {
        this.loadDriversAttendanceAndLeave();
    }

    getRatingStars(rating: number): string {
        if (!rating) return '';
        return '⭐'.repeat(Math.round(rating));
    }
}
