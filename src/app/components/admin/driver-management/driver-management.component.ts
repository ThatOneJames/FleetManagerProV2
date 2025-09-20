import { Component, OnInit } from '@angular/core';
import { DriverService } from '../../../services/driver.service';
import { User, UserStatus, UserRole } from '../../../models/user.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Driver } from '../../../models/driver.model';

@Component({
    selector: 'app-driver-management',
    templateUrl: './driver-management.component.html',
    styleUrls: ['./driver-management.component.css']
})
export class DriverManagementComponent implements OnInit {
    drivers: User[] = [];
    searchText: string = '';
    filterStatus: string = 'All';
    showAddDriverForm: boolean = false;
    registrationForm: FormGroup;
    errorMessage: string | null = null;
    successMessage: string | null = null;

    constructor(private driverService: DriverService, private fb: FormBuilder, private http: HttpClient) {
        this.registrationForm = this.fb.group({
            name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    ngOnInit(): void {
        this.loadDrivers();
    }

    loadDrivers() {
        this.driverService.getAllDrivers().subscribe((data: User[]) => {
            this.drivers = data.filter(user => user.role === UserRole.Driver);
        });
    }

    get filteredDrivers() {
        return this.drivers.filter(driver =>
            (this.filterStatus === 'All' || driver.status === this.getNumericStatus(this.filterStatus)) &&
            driver.name?.toLowerCase().includes(this.searchText.toLowerCase())
        );
    }

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

    getStringStatus(status: UserStatus): string {
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

    toggleAddDriverForm() {
        this.showAddDriverForm = !this.showAddDriverForm;
        if (!this.showAddDriverForm) {
            this.registrationForm.reset();
            this.errorMessage = null;
            this.successMessage = null;
        }
    }

    addDriver() {
        if (this.registrationForm.invalid) {
            this.errorMessage = 'Please fill out all required fields correctly.';
            return;
        }

        this.errorMessage = null;
        this.successMessage = null;

        const apiUrl = 'http://localhost:5129/api/auth/register';
        const userDto = {
            ...this.registrationForm.value,
            role: 'Driver'
        };

        this.http.post(apiUrl, userDto).subscribe({
            next: (response: any) => {
                this.successMessage = response.message;
                this.loadDrivers();
                this.registrationForm.reset();
                this.toggleAddDriverForm();
            },
            error: (err: any) => {
                this.errorMessage = err.error.message || 'Failed to add driver.';
            }
        });
    }

    deleteDriver(id: string) {
        this.driverService.deleteDriver(id).subscribe(() => {
            this.loadDrivers();
        });
    }
}
