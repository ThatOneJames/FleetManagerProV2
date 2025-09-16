import { Component } from '@angular/core';

@Component({
    selector: 'app-driver-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DriverDashboardComponent {

    currentTrip = {
        destination: "Downtown Hub",
        estimatedArrival: "2:45 PM",
        distance: "12.5 miles",
        stops: [
            { address: "123 Main St", status: "completed" },
            { address: "456 Oak Ave", status: "current" },
            { address: "789 Pine St", status: "pending" }
        ]
    };

    todaySchedule = [
        { time: "9:00 AM", task: "Vehicle Inspection", status: "completed" },
        { time: "9:30 AM", task: "Route: Downtown Circuit", status: "in-progress" },
        { time: "2:00 PM", task: "Lunch Break", status: "pending" },
        { time: "3:00 PM", task: "Route: Industrial Zone", status: "pending" },
        { time: "6:00 PM", task: "End of Shift", status: "pending" }
    ];

    notifications = [
        { id: 1, message: "New route assigned for tomorrow", time: "10 min ago", priority: "medium" },
        { id: 2, message: "Vehicle inspection due next week", time: "1 hour ago", priority: "high" },
        { id: 3, message: "Schedule updated for Friday", time: "2 hours ago", priority: "low" }
    ];

    driverStats = {
        milesThisWeek: 245,
        tripsCompleted: 18,
        onTimeDeliveries: 16,
        fuelEfficiency: 8.4,
        hoursWorked: 32
    };

    getStatusColor(status: string): string {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700';
            case 'in-progress': return 'bg-blue-100 text-blue-700';
            case 'current': return 'bg-blue-100 text-blue-700';
            case 'pending': return 'bg-gray-100 text-gray-500';
            default: return 'bg-gray-100 text-gray-500';
        }
    }

    getPriorityColor(priority: string): string {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-700';
            case 'medium': return 'bg-yellow-100 text-yellow-700';
            case 'low': return 'bg-gray-100 text-gray-500';
            default: return 'bg-gray-100 text-gray-500';
        }
    }

    getOnTimeRate(): number {
        return Math.round((this.driverStats.onTimeDeliveries / this.driverStats.tripsCompleted) * 100);
    }

}
