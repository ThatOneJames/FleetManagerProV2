import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { VehicleService } from '../../../services/vehicle.service';
import { Vehicle } from '../../../models/vehicle.model';

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
            licensePlate: ['', Validators.required],
            make: ['', Validators.required],
            model: ['', Validators.required],
            year: ['', Validators.required],
            vin: ['', Validators.required],
            color: [''],
            fuelType: ['gasoline'],
            fuelCapacity: [0],
            currentMileage: [0, Validators.required],
            status: ['active', Validators.required],
            currentDriverId: [''],
            fuelLevel: [0],
            registrationExpiry: ['', Validators.required],
            insuranceExpiry: ['', Validators.required],
            insurancePolicy: [''],
            purchaseDate: [''],
            purchasePrice: [0],
            additionalNotes: ['']
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
            (this.filterStatus ? v.status === this.filterStatus : true) &&
            (this.searchText ? v.model.toLowerCase().includes(this.searchText.toLowerCase()) || v.licensePlate.toLowerCase().includes(this.searchText.toLowerCase()) : true)
        );
    }

    openAddVehicleForm() {
        this.showAddVehicleForm = true;
    }

    closeAddVehicleForm() {
        this.showAddVehicleForm = false;
        this.vehicleForm.reset({ status: 'active' });
    }

    addVehicle() {
        if (this.vehicleForm.invalid) {
            return;
        }

        const newVehicle = this.vehicleForm.value;
        this.vehicleService.addVehicle(newVehicle).subscribe(() => {
            this.loadVehicles();
            this.closeAddVehicleForm();
        });
    }
}
