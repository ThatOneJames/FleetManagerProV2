import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VehicleService } from '../../../services/vehicle.service';
import { Vehicle } from '../../../models/vehicle.model';

// Recreate the C# DTO as a TypeScript interface, with matching data types
export interface CreateVehicleDto {
    categoryId: number;
    make: string;
    model: string;
    year: number;
    licensePlate: string;
    color?: string;
    fuelType?: string;
    fuelCapacity?: number;
    currentMileage: number;
    status: string;
    fuelLevel?: number;
    registrationExpiry: string;
    insuranceExpiry: string;
    insurancePolicy?: string;
    purchaseDate?: string;
    purchasePrice?: number;
}

@Component({
    selector: 'app-fleet-management',
    templateUrl: './fleet-management.component.html',
    styleUrls: ['./fleet-management.component.css']
})
export class FleetManagementComponent implements OnInit {
    searchText: string = '';
    filterStatus: string = '';
    showAddVehicleForm: boolean = false;
    vehicles: Vehicle[] = [];
    vehicleForm: FormGroup;

    constructor(private fb: FormBuilder, private vehicleService: VehicleService) {
        this.vehicleForm = this.fb.group({
            categoryId: [1, [Validators.required, Validators.min(1)]], // Changed from 0 to 1
            licensePlate: ['', Validators.required],
            make: ['', Validators.required],
            model: ['', Validators.required],
            year: [new Date().getFullYear(), [Validators.required, Validators.min(1900)]], // Set current year as default
            color: [''],
            fuelType: ['gasoline'],
            fuelCapacity: [0],
            currentMileage: [0, [Validators.required, Validators.min(0)]],
            status: ['Ready', Validators.required],
            fuelLevel: [100],
            registrationExpiry: ['', Validators.required],
            insuranceExpiry: ['', Validators.required], // This was missing from HTML
            insurancePolicy: [''],
            purchaseDate: [''],
            purchasePrice: [0],
        });
    }

    ngOnInit(): void {
        this.loadVehicles();
    }

    loadVehicles() {
        this.vehicleService.getAllVehicles().subscribe((data: Vehicle[]) => {
            this.vehicles = data;
        });
    }

    get filteredVehicles(): Vehicle[] {
        return this.vehicles.filter(v =>
            (this.filterStatus ? v.status.toLowerCase().replace(/\s/g, '') === this.filterStatus.toLowerCase() : true) &&
            (this.searchText ? v.model.toLowerCase().includes(this.searchText.toLowerCase()) || v.licensePlate.toLowerCase().includes(this.searchText.toLowerCase()) : true)
        );
    }

    openAddVehicleForm() {
        this.showAddVehicleForm = true;
        // Reset form with proper default values
        this.vehicleForm.patchValue({
            categoryId: 1,
            status: 'Ready',
            fuelType: 'gasoline',
            fuelLevel: 100,
            year: new Date().getFullYear(),
            currentMileage: 0,
            fuelCapacity: 0,
            purchasePrice: 0
        });
    }

    closeAddVehicleForm() {
        this.showAddVehicleForm = false;
        this.vehicleForm.reset();
    }

    addVehicle() {
        console.log('Form status:', this.vehicleForm.status);
        console.log('Form errors:', this.getFormValidationErrors());

        if (this.vehicleForm.invalid) {
            // Mark all fields as touched to show validation errors
            this.markFormGroupTouched(this.vehicleForm);
            console.log('Form is invalid, cannot submit');
            return;
        }

        const newVehicleDto: CreateVehicleDto = {
            categoryId: this.vehicleForm.value.categoryId,
            make: this.vehicleForm.value.make,
            model: this.vehicleForm.value.model,
            year: this.vehicleForm.value.year,
            licensePlate: this.vehicleForm.value.licensePlate,
            color: this.vehicleForm.value.color,
            fuelType: this.vehicleForm.value.fuelType,
            fuelCapacity: this.vehicleForm.value.fuelCapacity,
            currentMileage: this.vehicleForm.value.currentMileage,
            status: this.vehicleForm.value.status,
            fuelLevel: this.vehicleForm.value.fuelLevel,
            registrationExpiry: this.vehicleForm.value.registrationExpiry,
            insuranceExpiry: this.vehicleForm.value.insuranceExpiry,
            insurancePolicy: this.vehicleForm.value.insurancePolicy,
            purchaseDate: this.vehicleForm.value.purchaseDate,
            purchasePrice: this.vehicleForm.value.purchasePrice,
        };

        console.log('Adding new vehicle:', newVehicleDto);

        this.vehicleService.addVehicle(newVehicleDto).subscribe({
            next: (response) => {
                console.log('Vehicle added successfully:', response);
                this.loadVehicles();
                this.closeAddVehicleForm();
            },
            error: (err) => {
                console.error('Error adding vehicle:', err);
                alert('An error occurred while adding the vehicle. Check the console for details.');
            }
        });
    }

    // Helper method to mark all form fields as touched
    private markFormGroupTouched(formGroup: FormGroup) {
        Object.keys(formGroup.controls).forEach(key => {
            const control = formGroup.get(key);
            control?.markAsTouched();

            if (control instanceof FormGroup) {
                this.markFormGroupTouched(control);
            }
        });
    }

    // Helper method to get form validation errors for debugging
    private getFormValidationErrors() {
        let formErrors: any = {};
        Object.keys(this.vehicleForm.controls).forEach(key => {
            const controlErrors = this.vehicleForm.get(key)?.errors;
            if (controlErrors) {
                formErrors[key] = controlErrors;
            }
        });
        return formErrors;
    }

    // Helper method to check if a field has errors
    hasError(fieldName: string, errorType: string): boolean {
        const field = this.vehicleForm.get(fieldName);
        return !!(field?.hasError(errorType) && (field?.dirty || field?.touched));
    }

    // Helper method to get error message
    getErrorMessage(fieldName: string): string {
        const field = this.vehicleForm.get(fieldName);
        if (field?.hasError('required')) {
            return `${fieldName} is required`;
        }
        if (field?.hasError('min')) {
            return `${fieldName} must be greater than ${field.errors?.['min']?.min}`;
        }
        return '';
    }
}