import { Component } from '@angular/core';

interface Driver {
    id: number;
    name: string;
    status: 'Active' | 'On Leave' | 'Suspended';
    rating: number;
    phone: string;
}

@Component({
    selector: 'app-driver-management',
    templateUrl: './driver-management.component.html',
    styleUrls: ['./driver-management.component.css']
})
export class DriverManagementComponent {
    drivers: Driver[] = [
        { id: 1, name: 'John Smith', status: 'Active', rating: 4.5, phone: '0917-123-4567' },
        { id: 2, name: 'Jane Doe', status: 'On Leave', rating: 4.2, phone: '0917-234-5678' },
        { id: 3, name: 'Mike Johnson', status: 'Active', rating: 4.8, phone: '0917-345-6789' },
    ];

    searchText: string = '';
    filterStatus: string = 'All';
    showAddDriverForm: boolean = false;

    get filteredDrivers() {
        return this.drivers.filter(driver =>
            (this.filterStatus === 'All' || driver.status === this.filterStatus) &&
            driver.name.toLowerCase().includes(this.searchText.toLowerCase())
        );
    }

    toggleAddDriverForm() {
        this.showAddDriverForm = !this.showAddDriverForm;
    }

    addDriver(newDriver: Driver) {
        this.drivers.push({ ...newDriver, id: this.drivers.length + 1 });
        this.toggleAddDriverForm();
    }

    deleteDriver(id: number) {
        this.drivers = this.drivers.filter(d => d.id !== id);
    }
}
