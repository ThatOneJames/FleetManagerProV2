import { Component, OnInit } from '@angular/core';
import { DriverService } from '../services/driver.service';
import { Driver } from '../models/driver.model';

@Component({
    selector: 'app-driver-management',
    templateUrl: './driver-management.component.html',
    styleUrls: ['./driver-management.component.css']
})
export class DriverManagementComponent implements OnInit {
    drivers: Driver[] = [];
    searchText: string = '';
    filterStatus: string = 'All';
    showAddDriverForm: boolean = false;

    constructor(private driverService: DriverService) { }

    ngOnInit(): void {
        this.loadDrivers();
    }

    loadDrivers() {
        this.driverService.getDrivers().subscribe(data => {
            this.drivers = data;
        });
    }

    get filteredDrivers() {
        return this.drivers.filter(driver =>
            (this.filterStatus === 'All' || driver.user?.status === this.filterStatus) &&
            driver.user?.name.toLowerCase().includes(this.searchText.toLowerCase())
        );
    }

    toggleAddDriverForm() {
        this.showAddDriverForm = !this.showAddDriverForm;
    }

    addDriver(newDriver: Driver) {
        this.driverService.addDriver(newDriver).subscribe(() => {
            this.loadDrivers();
            this.toggleAddDriverForm();
        });
    }

    deleteDriver(id: string) {
        this.driverService.deleteDriver(id).subscribe(() => {
            this.loadDrivers();
        });
    }
}
