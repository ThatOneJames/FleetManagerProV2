import { Component, OnInit } from '@angular/core';
import { DriverService } from '../../../services/driver.service';
import { User, UserStatus, UserRole } from '../../../models/user.model';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
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

    driversAttendance: Map<string, { clockedIn: boolean; clockedOut: boolean }> = new Map();
    driversAttendanceData: Map<string, any> = new Map();
    driversOnLeave: Map<string, any> = new Map();
    driversInRoute: Map<string, boolean> = new Map();
    isLoadingAttendance: boolean = false;

    showAddDriverForm: boolean = false;
    showEditDriverForm: boolean = false;
    showDeleteConfirm: boolean = false;

    registrationForm!: FormGroup;
    editForm!: FormGroup;

    editingDriver: User | null = null;
    driverToDelete: User | null = null;

    errorMessage: string | null = null;
    successMessage: string | null = null;

    availableLicenseClasses = [
        { code: 'B1', name: 'Light Trucks (Up to 4,500 kg)' },
        { code: 'B2', name: 'Heavy Trucks (Over 4,500 kg)' },
        { code: 'C', name: 'Trucks with Trailer' },
        { code: 'CE', name: 'Articulated Trucks' }
    ];

    private readonly apiUrl = 'https://fleetmanagerprov2-production.up.railway.app/api';

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
        this.registrationForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            phone: ['', [Validators.required]],
            address: [''],
            dateOfBirth: [''],
            emergencyContact: ['', [Validators.required]],
            status: ['Active', [Validators.required]],
            licenseNumber: ['', [Validators.required]],
            licenseClasses: this.fb.array([], Validators.required),
            licenseExpiry: ['', [Validators.required]],
            experienceYears: [0, [Validators.min(0)]],
            safetyRating: [0, [Validators.min(0), Validators.max(5)]]
        });

        this.editForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            phone: ['', [Validators.required]],
            address: [''],
            dateOfBirth: [''],
            emergencyContact: ['', [Validators.required]],
            status: ['Active', [Validators.required]],
            licenseNumber: ['', [Validators.required]],
            licenseClasses: this.fb.array([], Validators.required),
            licenseExpiry: ['', [Validators.required]],
            experienceYears: [0, [Validators.min(0)]],
            safetyRating: [0, [Validators.min(0), Validators.max(5)]],
            totalMilesDriven: [0, [Validators.min(0)]],
            isAvailable: [true],
            hasHelper: [false]
        });
    }

    get registrationLicenseClasses(): FormArray {
        return this.registrationForm.get('licenseClasses') as FormArray;
    }

    get editLicenseClasses(): FormArray {
        return this.editForm.get('licenseClasses') as FormArray;
    }

    isRegistrationLicenseSelected(code: string): boolean {
        return this.registrationLicenseClasses.value.includes(code);
    }

    isEditLicenseSelected(code: string): boolean {
        return this.editLicenseClasses.value.includes(code);
    }

    onRegistrationLicenseChange(code: string, event: any): void {
        const formArray = this.registrationLicenseClasses;
        if (event.target.checked) {
            formArray.push(new FormControl(code));
        } else {
            const index = formArray.controls.findIndex(x => x.value === code);
            if (index >= 0) {
                formArray.removeAt(index);
            }
        }
    }

    onEditLicenseChange(code: string, event: any): void {
        const formArray = this.editLicenseClasses;
        if (event.target.checked) {
            formArray.push(new FormControl(code));
        } else {
            const index = formArray.controls.findIndex(x => x.value === code);
            if (index >= 0) {
                formArray.removeAt(index);
            }
        }
    }

    loadDrivers(): void {
        this.driverService.getAllDrivers().subscribe({
            next: (data: User[]) => {
                this.drivers = data;
                this.loadDriversAttendanceAndLeave();
                this.clearMessages();
            },
            error: (err) => {
                console.error('Error loading drivers:', err);
                this.errorMessage = 'Failed to load drivers. Please try again.';
            }
        });
    }

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

        const attendanceRequests = this.drivers.map(driver =>
            this.http.get<any>(`${this.apiUrl}/attendance/driver/${driver.id}/today`, { headers })
                .pipe(
                    catchError(error => {
                        console.log(`No attendance found for driver ${driver.name}`);
                        return of(null);
                    })
                )
        );

        const leaveRequests = this.drivers.map(driver =>
            this.http.get<any>(`${this.apiUrl}/leaverequests/driver/${driver.id}/active`, { headers })
                .pipe(
                    catchError(error => {
                        return of(null);
                    })
                )
        );

        forkJoin([forkJoin(attendanceRequests), forkJoin(leaveRequests)]).subscribe({
            next: ([attendanceResponses, leaveResponses]) => {
                attendanceResponses.forEach((response, index) => {
                    const driver = this.drivers[index];

                    if (response === null) {
                        this.driversAttendance.set(driver.id!, { clockedIn: false, clockedOut: false });
                        this.driversAttendanceData.set(driver.id!, null);
                        return;
                    }

                    let hasClockedIn = false;
                    let hasClockedOut = false;
                    let attendanceData = null;

                    if (response?.data) {
                        hasClockedIn = response.data.clockIn !== null;
                        hasClockedOut = response.data.clockOut !== null;
                        attendanceData = response.data;
                    } else if (response?.clockIn !== null) {
                        hasClockedIn = true;
                        hasClockedOut = response?.clockOut !== null;
                        attendanceData = response;
                    } else if (response?.status === 'Present' || response?.data?.status === 'Present') {
                        hasClockedIn = true;
                        attendanceData = response?.data || response;
                    }

                    this.driversAttendance.set(driver.id!, {
                        clockedIn: hasClockedIn,
                        clockedOut: hasClockedOut
                    });

                    this.driversAttendanceData.set(driver.id!, attendanceData);
                });

                leaveResponses.forEach((response, index) => {
                    const driver = this.drivers[index];

                    if (response === null || !response) {
                        this.driversOnLeave.set(driver.id!, null);
                        return;
                    }

                    let activeLeave = null;

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
                });

                this.loadDriversInRouteStatus();

                this.isLoadingAttendance = false;
            },
            error: (error) => {
                console.error('Error loading data:', error);
                this.drivers.forEach(driver => {
                    this.driversAttendance.set(driver.id!, { clockedIn: false, clockedOut: false });
                    this.driversAttendanceData.set(driver.id!, null);
                    this.driversOnLeave.set(driver.id!, null);
                });
                this.isLoadingAttendance = false;
            }
        });
    }

    private loadDriversInRouteStatus(): void {
        const token = localStorage.getItem('token');
        if (!token) return;

        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        });

        this.http.get<any[]>(`${this.apiUrl}/routes`, { headers }).subscribe({
            next: (routes) => {
                this.driversInRoute.clear();
                routes.forEach(route => {
                    if (route.status === 'in_progress' && route.driverId) {
                        this.driversInRoute.set(route.driverId, true);
                    }
                });
            },
            error: (err) => {
                console.error('Error loading routes:', err);
            }
        });
    }

    isDriverInRoute(driverId: string): boolean {
        return this.driversInRoute.get(driverId) === true;
    }

    private formatTimeForCSV(timeStr?: string): string {
        if (!timeStr) return 'N/A';

        try {
            const cleanTime = timeStr.split('.')[0];

            if (cleanTime.length <= 8 && !cleanTime.includes('T') && !cleanTime.includes('Z')) {
                const parts = cleanTime.split(':');
                if (parts.length >= 2) {
                    let hours = parseInt(parts[0], 10);
                    const minutes = parseInt(parts[1], 10);

                    hours = (hours + 8) % 24;

                    const period = hours >= 12 ? 'PM' : 'AM';
                    const displayHours = hours % 12 || 12;
                    const displayMinutes = minutes.toString().padStart(2, '0');

                    return `${displayHours}:${displayMinutes} ${period}`;
                }
            }

            return 'N/A';
        } catch (error) {
            console.error('Error formatting time:', timeStr, error);
            return 'N/A';
        }
    }

    private isLeaveActiveToday(leave: any): boolean {
        if (!leave || !leave.startDate || !leave.endDate) {
            return false;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startDate = new Date(leave.startDate);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(leave.endDate);
        endDate.setHours(0, 0, 0, 0);

        return today >= startDate && today <= endDate;
    }

    isDriverOnLeave(driverId: string): boolean {
        const leave = this.driversOnLeave.get(driverId);
        return leave !== null && leave !== undefined;
    }

    getDriverLeaveType(driverId: string): string {
        const leave = this.driversOnLeave.get(driverId);
        if (!leave) return '';
        return leave.leaveType || leave.type || '';
    }

    hasDriverClockedInToday(driverId: string): boolean {
        const attendance = this.driversAttendance.get(driverId);
        return attendance?.clockedIn ?? false;
    }

    hasDriverClockedOutToday(driverId: string): boolean {
        const attendance = this.driversAttendance.get(driverId);
        return attendance?.clockedOut ?? false;
    }

    getAvailabilityText(driverId: string): string {
        if (this.isDriverOnLeave(driverId)) {
            return 'On Leave';
        }

        if (this.isDriverInRoute(driverId)) {
            return 'In Route';
        }

        const attendance = this.driversAttendance.get(driverId);

        if (attendance?.clockedOut) {
            return 'Unavailable';
        }

        if (attendance?.clockedIn) {
            return 'Available';
        }

        return 'Unavailable';
    }

    getAvailabilitySubtitle(driverId: string): string {
        if (this.isDriverOnLeave(driverId)) {
            const leaveType = this.getDriverLeaveType(driverId);
            return leaveType ? `${leaveType} Leave` : 'On Leave';
        }

        if (this.isDriverInRoute(driverId)) {
            return 'On Active Route';
        }

        const attendance = this.driversAttendance.get(driverId);

        if (attendance?.clockedOut) {
            return 'Clocked Out';
        }

        if (attendance?.clockedIn) {
            return 'Clocked In';
        }

        return 'Not Clocked In';
    }

    getAvailabilityClass(driverId: string): string {
        if (this.isDriverOnLeave(driverId)) {
            return 'on-leave';
        }

        if (this.isDriverInRoute(driverId)) {
            return 'in-route';
        }

        const attendance = this.driversAttendance.get(driverId);

        if (attendance?.clockedOut) {
            return 'clocked-out';
        }

        if (attendance?.clockedIn) {
            return 'clocked-in';
        }

        return 'not-clocked-in';
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
            this.registrationForm.patchValue({ status: 'Active' });
            this.registrationLicenseClasses.clear();
        }
        this.clearMessages();
    }

    addDriver(): void {
        if (this.registrationForm.invalid) {
            this.markFormGroupTouched(this.registrationForm);
            this.errorMessage = 'Please fill out all required fields correctly.';
            return;
        }

        if (this.registrationLicenseClasses.length === 0) {
            this.errorMessage = 'Please select at least one license class.';
            return;
        }

        this.clearMessages();

        const formData = this.registrationForm.value;
        const licenseClassString = this.registrationLicenseClasses.value.join(',');

        const userDto = {
            ...formData,
            role: 'Driver',
            status: formData.status || 'Active',
            isAvailable: true,
            hasHelper: false,
            licenseClass: licenseClassString,
            phone: formData.phone || null,
            address: formData.address || null,
            emergencyContact: formData.emergencyContact || null,
            licenseNumber: formData.licenseNumber || null,
            licenseExpiry: formData.licenseExpiry || null,
            dateOfBirth: formData.dateOfBirth || null
        };

        this.http.post(`${this.apiUrl}/auth/register`, userDto).subscribe({
            next: (response: any) => {
                this.successMessage = 'Driver added successfully!';
                this.loadDrivers();
                this.registrationForm.reset();
                this.registrationLicenseClasses.clear();
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

        const licenseClasses = driver.licenseClass ? driver.licenseClass.split(',') : [];
        this.editLicenseClasses.clear();
        licenseClasses.forEach(code => {
            this.editLicenseClasses.push(new FormControl(code.trim()));
        });

        this.editForm.patchValue({
            name: driver.name || '',
            email: driver.email || '',
            phone: driver.phone || '',
            address: driver.address || '',
            dateOfBirth: driver.dateOfBirth ? this.formatDate(driver.dateOfBirth) : '',
            emergencyContact: driver.emergencyContact || '',
            status: this.getStringStatus(driver.status),
            licenseNumber: driver.licenseNumber || '',
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

        if (this.editLicenseClasses.length === 0) {
            this.errorMessage = 'Please select at least one license class.';
            return;
        }

        this.clearMessages();

        const formData = this.editForm.value;
        const licenseClassString = this.editLicenseClasses.value.join(',');

        const updateData = {
            ...formData,
            licenseClass: licenseClassString,
            status: formData.status,
            phone: formData.phone || null,
            address: formData.address || null,
            emergencyContact: formData.emergencyContact || null,
            licenseNumber: formData.licenseNumber || null,
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
        this.editLicenseClasses.clear();
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
        this.registrationLicenseClasses.clear();
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
                this.successMessage = 'Driver availability updated successfully!';
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

    downloadAttendanceCSV(): void {
        const csvData = this.convertAttendanceToCSV(this.filteredDrivers);
        const today = new Date().toISOString().split('T')[0];
        this.downloadCSV(csvData, `driver_attendance_${today}.csv`);
    }

    private convertToCSV(data: User[]): string {
        const headers = ['ID', 'Name', 'Email', 'Phone', 'Status', 'License Number', 'License Class',
            'Experience Years', 'Safety Rating', 'Total Miles', 'Available', 'Has Helper',
            'Clocked In', 'Clocked Out', 'On Leave'];

        const rows = data.map(driver => [
            driver.id || '',
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
            this.hasDriverClockedOutToday(driver.id!) ? 'Yes' : 'No',
            this.isDriverOnLeave(driver.id!) ? 'Yes' : 'No'
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        return csvContent;
    }

    private convertAttendanceToCSV(data: User[]): string {
        const today = new Date().toISOString().split('T')[0];

        const headers = [
            'Driver ID',
            'Driver Name',
            'Email',
            'Phone',
            'License Number',
            'Date',
            'Clocked In',
            'Clock-In Time',
            'Clocked Out',
            'Clock-Out Time',
            'Total Hours',
            'Availability Status',
            'On Leave',
            'Leave Type',
            'Driver Status'
        ];

        const rows = data.map(driver => {
            const attendance = this.driversAttendance.get(driver.id!);
            const attendanceData = this.driversAttendanceData.get(driver.id!);
            const onLeave = this.isDriverOnLeave(driver.id!);
            const leaveType = onLeave ? this.getDriverLeaveType(driver.id!) : 'N/A';

            return [
                driver.id || '',
                driver.name || '',
                driver.email || '',
                driver.phone || 'N/A',
                driver.licenseNumber || 'N/A',
                today,
                attendance?.clockedIn ? 'Yes' : 'No',
                attendanceData?.clockIn ? this.formatTimeForCSV(attendanceData.clockIn) : 'N/A',
                attendance?.clockedOut ? 'Yes' : 'No',
                attendanceData?.clockOut ? this.formatTimeForCSV(attendanceData.clockOut) : 'N/A',
                attendanceData?.totalHours ? `${attendanceData.totalHours}h` : 'N/A',
                this.getAvailabilityText(driver.id!),
                onLeave ? 'Yes' : 'No',
                leaveType,
                this.getStringStatus(driver.status)
            ];
        });

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
    }

    bulkStatusUpdate(newStatus: string): void {
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

    refreshAttendance(): void {
        this.loadDriversAttendanceAndLeave();
    }

    getRatingStars(rating: number): string {
        if (!rating) return '';
        return '⭐'.repeat(Math.round(rating));
    }
}
