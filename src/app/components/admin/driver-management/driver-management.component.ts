import { Component, OnInit } from '@angular/core';
import { DriverService } from '../../../services/driver.service';
import { User, UserStatus, UserRole } from '../../../models/user.model';
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

    constructor(private driverService: DriverService) { }

    ngOnInit(): void {
        this.loadDrivers();
    }

    loadDrivers() {
        this.driverService.getAllDrivers().subscribe((data: User[]) => {
            this.drivers = data;
        });
    }

    get filteredDrivers() {
        return this.drivers.filter(driver =>
            (this.filterStatus === 'All' || driver.status === this.getNumericStatus(this.filterStatus)) &&
            driver.name?.toLowerCase().includes(this.searchText.toLowerCase())
        );
    }

    getNumericStatus(status: string): UserStatus | undefined {
        switch (status) {
            case 'Active':
                return UserStatus.Active;
            case 'Inactive':
                return UserStatus.Inactive;
            case 'Suspended':
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
    }

    addDriver(newDriver: User) {
        newDriver.role = UserRole.Driver;
        newDriver.status = UserStatus.Active;
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
