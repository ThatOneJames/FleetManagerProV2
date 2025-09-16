import { Component } from '@angular/core';

interface MaintenanceRecord {
    vehicle: string;
    date: string;
    type: string;
    status: string;
}

@Component({
    selector: 'app-maintenance',
    templateUrl: './maintenance.component.html',
    styleUrls: ['./maintenance.component.css']
})
export class MaintenanceComponent {
    records: MaintenanceRecord[] = [
        { vehicle: 'Truck 101', date: '2025-08-15', type: 'Oil Change', status: 'Completed' },
        { vehicle: 'Truck 102', date: '2025-08-20', type: 'Brake Check', status: 'Scheduled' }
    ];

    newRecord: MaintenanceRecord = { vehicle: '', date: '', type: '', status: 'Scheduled' };

    addRecord() {
        if (!this.newRecord.vehicle || !this.newRecord.date || !this.newRecord.type) return;
        this.records.push({ ...this.newRecord });
        this.newRecord = { vehicle: '', date: '', type: '', status: 'Scheduled' };
    }
}
