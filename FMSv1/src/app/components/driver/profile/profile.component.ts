// profile.component.ts
import { Component } from '@angular/core';

@Component({
    selector: 'app-driver-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css']
})
export class DriverProfileComponent {
    isEditing = false;

    driverDetails = {
        id: 'D001',
        name: 'John Doe',
        email: 'johndoe@example.com',
        phone: '(555) 123-4567',
        address: '123 Main Street, City, State 12345',
        dateOfBirth: '1985-06-15',
        hireDate: '2020-03-15',
        emergencyContact: 'Jane Smith - (555) 987-6543',
        licenseNumber: 'DL123456789',
        licenseExpiry: '2025-08-15',
        licenseClass: 'CDL Class B',
        currentVehicle: 'TR-001',
        totalMiles: 125000,
        rating: 4.8,
        experience: 8
    };

    toggleEdit() {
        this.isEditing = !this.isEditing;
    }
}
