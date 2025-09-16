import { Component } from '@angular/core';

interface Driver {
    id: number;
    name: string;
    status: string;
    vehicle: string;
}

@Component({
    selector: 'app-fleet-management',
    templateUrl: './fleet-management.component.html',
    styleUrls: ['./fleet-management.component.css']
})
export class FleetManagementComponent {
    searchText: string = '';
    filterStatus: string = '';

    drivers: Driver[] = [
        { id: 1, name: 'Juan Dela Cruz', status: 'Active', vehicle: 'Truck 101' },
        { id: 2, name: 'Pedro Santos', status: 'Inactive', vehicle: 'Truck 202' },
        { id: 3, name: 'Maria Lopez', status: 'Active', vehicle: 'Truck 303' }
    ];

    get filteredDrivers(): Driver[] {
        return this.drivers.filter(d =>
            (this.filterStatus ? d.status === this.filterStatus : true) &&
            (this.searchText ? d.name.toLowerCase().includes(this.searchText.toLowerCase()) : true)
        );
    }

    addDriver(newDriver: any) {
        const id = this.drivers.length + 1;
        this.drivers.push({
            id,
            name: newDriver.name,
            status: newDriver.status,
            vehicle: newDriver.vehicle
        });
    }
}
