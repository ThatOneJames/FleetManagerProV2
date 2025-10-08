import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VehicleService } from '../../../services/vehicle.service';
import { DriverService } from '../../../services/driver.service';
import { Vehicle, CreateVehicleDto, UpdateVehicleDto, VehicleCategory } from '../../../models/vehicle.model';
import { User } from '../../../models/user.model';

@Component({
    selector: 'app-fleet-management',
    templateUrl: './fleet-management.component.html',
    styleUrls: ['./fleet-management.component.css']
})
export class FleetManagementComponent implements OnInit {
    vehicles: Vehicle[] = [];
    filteredVehicles: Vehicle[] = [];
    availableDrivers: User[] = [];
    categories: VehicleCategory[] = [
        { id: '1', name: 'Truck', description: 'Heavy duty trucks', createdAt: new Date() },
        { id: '2', name: 'Van', description: 'Delivery vans', createdAt: new Date() },
        { id: '3', name: 'Car', description: 'Passenger cars', createdAt: new Date() },
        { id: '4', name: 'Bus', description: 'Passenger buses', createdAt: new Date() }
    ];

    vehicleForm!: FormGroup;
    editForm!: FormGroup;

    isLoading = false;
    showAddForm = false;
    showEditForm = false;
    editingVehicleId: string | null = null;

    searchText = '';
    statusFilter = '';
    categoryFilter = '';
    fuelTypeFilter = '';

    successMessage = '';
    errorMessage = '';

    statusOptions = ['Ready', 'Active', 'Maintenance', 'Inactive', 'OnRoute', 'Retired', 'NotAvailable', 'InUse', 'OutOfService'];
    fuelTypeOptions = ['Gasoline', 'Diesel', 'Electric', 'Hybrid'];

    constructor(
        private vehicleService: VehicleService,
        private driverService: DriverService,
        private formBuilder: FormBuilder
    ) { }

    ngOnInit(): void {
        this.initializeForms();
        this.loadVehicles();
        this.loadDrivers();
    }

    initializeForms(): void {
        this.vehicleForm = this.formBuilder.group({
            categoryId: ['1', [Validators.required]],
            make: ['', [Validators.required, Validators.minLength(2)]],
            model: ['', [Validators.required, Validators.minLength(2)]],
            year: [new Date().getFullYear(), [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear() + 1)]],
            licensePlate: ['', [Validators.required]],
            color: [''],
            fuelType: ['Gasoline', Validators.required],
            fuelCapacity: [0, [Validators.min(0)]],
            currentMileage: [0, [Validators.required, Validators.min(0)]],
            status: ['Ready', Validators.required],
            fuelLevel: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
            registrationExpiry: ['', Validators.required],
            insuranceExpiry: ['', Validators.required],
            insurancePolicy: [''],
            purchaseDate: [''],
            purchasePrice: [0, [Validators.min(0)]]
        });

        this.editForm = this.formBuilder.group({
            categoryId: ['1', [Validators.required]],
            make: ['', [Validators.required, Validators.minLength(2)]],
            model: ['', [Validators.required, Validators.minLength(2)]],
            year: [new Date().getFullYear(), [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear() + 1)]],
            licensePlate: ['', [Validators.required]],
            color: [''],
            fuelType: ['Gasoline', Validators.required],
            fuelCapacity: [0, [Validators.min(0)]],
            currentMileage: [0, [Validators.required, Validators.min(0)]],
            status: ['Ready', Validators.required],
            fuelLevel: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
            registrationExpiry: ['', Validators.required],
            insuranceExpiry: ['', Validators.required],
            insurancePolicy: [''],
            purchaseDate: [''],
            purchasePrice: [0, [Validators.min(0)]],
            currentDriverId: ['']
        });
    }

    loadVehicles(): void {
        this.isLoading = true;
        this.vehicleService.getAllVehicles().subscribe({
            next: (vehicles) => {
                this.vehicles = vehicles;
                this.applyFilters();
                this.isLoading = false;
            },
            error: (error) => {
                this.errorMessage = 'Failed to load vehicles';
                this.isLoading = false;
                this.clearMessages();
            }
        });
    }

    // ✅ NEW: Get only available vehicles (not in maintenance, out of service, or retired)
    get availableVehicles(): Vehicle[] {
        return this.vehicles.filter(v =>
            v.status !== 'Maintenance' &&
            v.status !== 'OutOfService' &&
            v.status !== 'Retired'
        );
    }

    loadDrivers(): void {
        this.driverService.getAllDrivers().subscribe({
            next: (drivers) => {
                this.availableDrivers = drivers;
            },
            error: (error) => {
                console.error('Error loading drivers:', error);
            }
        });
    }

    applyFilters(): void {
        this.filteredVehicles = this.vehicles.filter(vehicle => {
            const matchesSearch = this.searchText === '' ||
                vehicle.make.toLowerCase().includes(this.searchText.toLowerCase()) ||
                vehicle.model.toLowerCase().includes(this.searchText.toLowerCase()) ||
                vehicle.licensePlate.toLowerCase().includes(this.searchText.toLowerCase());

            const matchesStatus = this.statusFilter === '' || vehicle.status === this.statusFilter;
            const matchesCategory = this.categoryFilter === '' || vehicle.categoryId === this.categoryFilter;
            const matchesFuelType = this.fuelTypeFilter === '' || vehicle.fuelType === this.fuelTypeFilter;

            return matchesSearch && matchesStatus && matchesCategory && matchesFuelType;
        });
    }

    onSearchChange(): void {
        this.applyFilters();
    }

    onStatusFilterChange(): void {
        this.applyFilters();
    }

    onCategoryFilterChange(): void {
        this.applyFilters();
    }

    onFuelTypeFilterChange(): void {
        this.applyFilters();
    }

    clearFilters(): void {
        this.searchText = '';
        this.statusFilter = '';
        this.categoryFilter = '';
        this.fuelTypeFilter = '';
        this.applyFilters();
    }

    showAddVehicleForm(): void {
        this.showAddForm = true;
        this.vehicleForm.reset();
        this.vehicleForm.patchValue({
            categoryId: '1',
            status: 'Ready',
            fuelType: 'Gasoline',
            fuelLevel: 100,
            year: new Date().getFullYear(),
            currentMileage: 0,
            fuelCapacity: 0,
            purchasePrice: 0
        });
        this.clearMessages();
    }

    hideAddVehicleForm(): void {
        this.showAddForm = false;
        this.vehicleForm.reset();
        this.clearMessages();
    }

    onSubmitAdd(): void {
        if (this.vehicleForm.invalid) {
            this.markFormGroupTouched(this.vehicleForm);
            this.errorMessage = 'Please fill out all required fields correctly.';
            return;
        }

        this.isLoading = true;
        const formData = this.vehicleForm.value;

        const vehicleDto: CreateVehicleDto = {
            categoryId: formData.categoryId,
            make: formData.make,
            model: formData.model,
            year: formData.year,
            licensePlate: formData.licensePlate,
            color: formData.color || null,
            fuelType: formData.fuelType || 'Gasoline',
            fuelCapacity: formData.fuelCapacity || 0,
            currentMileage: formData.currentMileage,
            status: formData.status || 'Ready',
            fuelLevel: formData.fuelLevel || 100,
            registrationExpiry: formData.registrationExpiry,
            insuranceExpiry: formData.insuranceExpiry,
            insurancePolicy: formData.insurancePolicy || null,
            purchaseDate: formData.purchaseDate || undefined,
            purchasePrice: formData.purchasePrice || null
        };

        this.vehicleService.addVehicle(vehicleDto).subscribe({
            next: (response) => {
                this.successMessage = 'Vehicle added successfully!';
                this.loadVehicles();
                this.hideAddVehicleForm();
                this.clearMessages();
            },
            error: (err) => {
                this.errorMessage = 'Failed to add vehicle. Please try again.';
                this.isLoading = false;
                this.clearMessages();
            }
        });
    }

    editVehicle(vehicle: Vehicle): void {
        this.editingVehicleId = vehicle.id;
        this.showEditForm = true;
        this.clearMessages();

        this.editForm.patchValue({
            categoryId: vehicle.categoryId || '1',
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            licensePlate: vehicle.licensePlate,
            color: vehicle.color || '',
            fuelType: vehicle.fuelType || 'Gasoline',
            fuelCapacity: vehicle.fuelCapacity || 0,
            currentMileage: vehicle.currentMileage,
            status: vehicle.status,
            fuelLevel: vehicle.fuelLevel,
            registrationExpiry: this.formatDateForInput(vehicle.registrationExpiry),
            insuranceExpiry: this.formatDateForInput(vehicle.insuranceExpiry),
            insurancePolicy: vehicle.insurancePolicy || '',
            purchaseDate: this.formatDateForInput(vehicle.purchaseDate),
            purchasePrice: vehicle.purchasePrice || 0,
            currentDriverId: vehicle.currentDriverId || ''
        });
    }

    onSubmitEdit(): void {
        if (this.editForm.invalid || !this.editingVehicleId) {
            this.markFormGroupTouched(this.editForm);
            this.errorMessage = 'Please fill out all required fields correctly.';
            return;
        }

        this.isLoading = true;
        const formData = this.editForm.value;

        const updatedVehicle: Vehicle = {
            id: this.editingVehicleId,
            categoryId: formData.categoryId,
            make: formData.make,
            model: formData.model,
            year: formData.year,
            licensePlate: formData.licensePlate,
            color: formData.color,
            fuelType: formData.fuelType,
            fuelCapacity: formData.fuelCapacity,
            currentMileage: formData.currentMileage,
            status: formData.status,
            fuelLevel: formData.fuelLevel,
            registrationExpiry: new Date(formData.registrationExpiry),
            insuranceExpiry: new Date(formData.insuranceExpiry),
            insurancePolicy: formData.insurancePolicy,
            purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate) : undefined,
            purchasePrice: formData.purchasePrice,
            currentDriverId: formData.currentDriverId,
            vin: '',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.vehicleService.updateVehicle(this.editingVehicleId, updatedVehicle).subscribe({
            next: (response) => {
                this.successMessage = 'Vehicle updated successfully!';
                this.loadVehicles();
                this.hideEditForm();
                this.clearMessages();
            },
            error: (err) => {
                this.errorMessage = 'Failed to update vehicle. Please try again.';
                this.isLoading = false;
                this.clearMessages();
            }
        });
    }

    hideEditForm(): void {
        this.showEditForm = false;
        this.editingVehicleId = null;
        this.editForm.reset();
        this.clearMessages();
    }

    deleteVehicle(vehicle: Vehicle): void {
        if (confirm(`Are you sure you want to delete vehicle ${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})?`)) {
            this.isLoading = true;

            this.vehicleService.deleteVehicle(vehicle.id).subscribe({
                next: () => {
                    this.successMessage = 'Vehicle deleted successfully!';
                    this.loadVehicles();
                    this.clearMessages();
                },
                error: (error) => {
                    this.errorMessage = 'Failed to delete vehicle';
                    this.isLoading = false;
                    this.clearMessages();
                }
            });
        }
    }

    getCategoryName(categoryId: string): string {
        const category = this.categories.find(c => c.id === categoryId);
        return category ? category.name : 'Unknown';
    }

    getStatusBadgeClass(status: string): string {
        return status.toLowerCase().replace(/\s+/g, '-');
    }

    getDriverName(driverId?: string): string {
        if (!driverId) return 'Unassigned';
        const driver = this.availableDrivers.find(d => d.id === driverId);
        return driver ? driver.name : 'Unknown Driver';
    }

    getCurrentDriverName(vehicle: Vehicle): string {
        return this.getDriverName(vehicle.currentDriverId);
    }

    isRegistrationExpiring(vehicle: Vehicle): boolean {
        const expiryDate = new Date(vehicle.registrationExpiry);
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);
        return expiryDate <= thirtyDaysFromNow && expiryDate >= now;
    }

    isInsuranceExpiring(vehicle: Vehicle): boolean {
        const expiryDate = new Date(vehicle.insuranceExpiry);
        const now = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);
        return expiryDate <= thirtyDaysFromNow && expiryDate >= now;
    }

    isRegistrationExpired(vehicle: Vehicle): boolean {
        return new Date(vehicle.registrationExpiry) < new Date();
    }

    isInsuranceExpired(vehicle: Vehicle): boolean {
        return new Date(vehicle.insuranceExpiry) < new Date();
    }

    exportToCSV(): void {
        const headers = ['Make', 'Model', 'Year', 'License Plate', 'Status', 'Fuel Type', 'Current Mileage'];
        const csvContent = [
            headers.join(','),
            ...this.filteredVehicles.map(vehicle => [
                vehicle.make,
                vehicle.model,
                vehicle.year,
                vehicle.licensePlate,
                vehicle.status,
                vehicle.fuelType,
                vehicle.currentMileage
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fleet_data_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    getFieldError(form: FormGroup, fieldName: string): string {
        const field = form.get(fieldName);
        if (field && field.invalid && field.touched) {
            if (field.errors?.['required']) return `${fieldName} is required`;
            if (field.errors?.['minlength']) return `${fieldName} is too short`;
            if (field.errors?.['min']) return `${fieldName} must be greater than ${field.errors['min'].min}`;
            if (field.errors?.['max']) return `${fieldName} must be less than ${field.errors['max'].max}`;
        }
        return '';
    }

    isFieldInvalid(form: FormGroup, fieldName: string): boolean {
        const field = form.get(fieldName);
        return !!(field && field.invalid && field.touched);
    }

    private formatDateForInput(date: string | Date | undefined): string {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    }

    private markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach(field => {
            const control = formGroup.get(field);
            control?.markAsTouched({ onlySelf: true });
        });
    }

    private clearMessages(): void {
        setTimeout(() => {
            this.successMessage = '';
            this.errorMessage = '';
        }, 3000);
    }
}
