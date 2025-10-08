import { Component, OnInit } from '@angular/core';
import { MaintenanceService } from '../../../services/maintenance.service';
import { MaintenanceRequestService, MaintenanceRequest } from '../../../services/maintenancerequest.service';
import { VehicleService } from '../../../services/vehicle.service';
import {
    MaintenanceTask,
    MaintenanceCategory,
    MaintenanceStatistics,
    CreateMaintenanceTaskDto
} from '../../../models/maintenance.model';
import { Vehicle } from '../../../models/vehicle.model';

@Component({
    selector: 'app-maintenance',
    templateUrl: './maintenance.component.html',
    styleUrls: ['./maintenance.component.css']
})
export class MaintenanceComponent implements OnInit {
    tasks: MaintenanceTask[] = [];
    filteredTasks: MaintenanceTask[] = [];

    maintenanceRequests: MaintenanceRequest[] = [];
    filteredRequests: MaintenanceRequest[] = [];

    vehicles: Vehicle[] = [];
    categories: MaintenanceCategory[] = [];
    statistics: MaintenanceStatistics | null = null;

    activeTab: 'tasks' | 'requests' = 'tasks';

    filterStatus: string = '';
    filterPriority: string = '';
    filterVehicle: string = '';

    filterRequestStatus: string = '';
    filterRequestSeverity: string = '';
    filterRequestVehicle: string = '';

    showAddForm: boolean = false;
    editingTask: MaintenanceTask | null = null;

    showRequestDetails: boolean = false;
    selectedRequest: MaintenanceRequest | null = null;

    newTask: CreateMaintenanceTaskDto = {
        vehicleId: '',
        categoryId: 0,
        taskType: '',
        description: '',
        priority: 'Medium',
        status: 'Scheduled',
        scheduledDate: '',
        estimatedCost: undefined,
        assignedTo: '',
        serviceProvider: ''
    };

    statusOptions = ['Scheduled', 'InProgress', 'Completed', 'Cancelled', 'Overdue'];
    priorityOptions = ['High', 'Medium', 'Low'];

    requestStatusOptions = ['Pending', 'InProgress', 'Completed', 'Cancelled'];
    severityOptions = ['Critical', 'High', 'Medium', 'Low'];

    loading: boolean = false;
    error: string = '';

    constructor(
        private maintenanceService: MaintenanceService,
        private maintenanceRequestService: MaintenanceRequestService,
        private vehicleService: VehicleService
    ) { }

    ngOnInit(): void {
        this.loadData();
    }

    loadData(): void {
        this.loading = true;
        this.error = '';

        this.maintenanceService.getAllTasks().subscribe({
            next: (data) => {
                this.tasks = data;
                this.applyFilters();
                this.calculateStatistics();
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Failed to load maintenance tasks';
                console.error(err);
                this.loading = false;
            }
        });

        this.maintenanceRequestService.getAllRequests().subscribe({
            next: (data) => {
                this.maintenanceRequests = data;
                this.applyRequestFilters();
                this.calculateStatistics();
            },
            error: (err) => {
                console.error('Failed to load maintenance requests:', err);
            }
        });

        this.vehicleService.getAllVehicles().subscribe({
            next: (data) => this.vehicles = data,
            error: (err) => console.error('Failed to load vehicles', err)
        });

        this.maintenanceService.getAllCategories().subscribe({
            next: (data) => this.categories = data,
            error: (err) => console.error('Failed to load categories', err)
        });
    }

    calculateStatistics(): void {
        const now = new Date();

        const scheduledFromTasks = this.tasks.filter(t => t.status === 'Scheduled').length;
        const inProgressFromTasks = this.tasks.filter(t => t.status === 'InProgress').length;
        const completedFromTasks = this.tasks.filter(t => t.status === 'Completed').length;
        const overdueFromTasks = this.tasks.filter(t => {
            if (t.status === 'Completed' || t.status === 'Cancelled') return false;
            return new Date(t.scheduledDate) < now;
        }).length;
        const costFromTasks = this.tasks.reduce((sum, t) => sum + (t.actualCost || t.estimatedCost || 0), 0);

        const scheduledFromRequests = this.maintenanceRequests.filter(r => r.status === 'Pending').length;
        const inProgressFromRequests = this.maintenanceRequests.filter(r => r.status === 'InProgress').length;
        const completedFromRequests = this.maintenanceRequests.filter(r => r.status === 'Completed').length;
        const overdueFromRequests = this.maintenanceRequests.filter(r => {
            if (r.status === 'Completed' || r.status === 'Cancelled') return false;
            if (!r.reportedDate) return false;
            const reportedDate = new Date(r.reportedDate);
            const hoursSinceReport = (now.getTime() - reportedDate.getTime()) / (1000 * 60 * 60);
            return hoursSinceReport > 24;
        }).length;
        const costFromRequests = this.maintenanceRequests.reduce((sum, r) => sum + (r.actualCost || r.estimatedCost || 0), 0);

        const totalTasks = this.tasks.length + this.maintenanceRequests.length;

        this.statistics = {
            totalTasks: totalTasks,
            scheduledTasks: scheduledFromTasks + scheduledFromRequests,
            inProgressTasks: inProgressFromTasks + inProgressFromRequests,
            completedTasks: completedFromTasks + completedFromRequests,
            overdueTasks: overdueFromTasks + overdueFromRequests,
            totalCost: costFromTasks + costFromRequests
        };

        console.log('Statistics updated:', this.statistics);
    }

    switchTab(tab: 'tasks' | 'requests'): void {
        this.activeTab = tab;
    }

    applyFilters(): void {
        this.filteredTasks = this.tasks.filter(task => {
            const statusMatch = !this.filterStatus || task.status === this.filterStatus;
            const priorityMatch = !this.filterPriority || task.priority === this.filterPriority;
            const vehicleMatch = !this.filterVehicle || task.vehicleId === this.filterVehicle;
            return statusMatch && priorityMatch && vehicleMatch;
        });
    }

    applyRequestFilters(): void {
        this.filteredRequests = this.maintenanceRequests.filter(request => {
            const statusMatch = !this.filterRequestStatus ||
                request.status?.replace(/\s+/g, '') === this.filterRequestStatus.replace(/\s+/g, '');

            const severityMatch = !this.filterRequestSeverity ||
                request.issueSeverity === this.filterRequestSeverity;

            const vehicleMatch = !this.filterRequestVehicle ||
                request.vehicleId === this.filterRequestVehicle;

            return statusMatch && severityMatch && vehicleMatch;
        });
    }

    onFilterChange(): void {
        this.applyFilters();
    }

    onRequestFilterChange(): void {
        this.applyRequestFilters();
    }

    clearFilters(): void {
        if (this.activeTab === 'tasks') {
            this.filterStatus = '';
            this.filterPriority = '';
            this.filterVehicle = '';
            this.applyFilters();
        } else {
            this.filterRequestStatus = '';
            this.filterRequestSeverity = '';
            this.filterRequestVehicle = '';
            this.applyRequestFilters();
        }
    }

    toggleAddForm(): void {
        this.showAddForm = !this.showAddForm;
        if (!this.showAddForm) {
            this.resetForm();
        }
    }

    resetForm(): void {
        this.newTask = {
            vehicleId: '',
            categoryId: 0,
            taskType: '',
            description: '',
            priority: 'Medium',
            status: 'Scheduled',
            scheduledDate: '',
            estimatedCost: undefined,
            assignedTo: '',
            serviceProvider: ''
        };
        this.editingTask = null;
    }

    addTask(): void {
        if (!this.validateForm()) {
            return;
        }

        this.loading = true;
        this.maintenanceService.createTask(this.newTask).subscribe({
            next: (task) => {
                this.tasks.unshift(task);
                this.applyFilters();
                this.resetForm();
                this.showAddForm = false;
                this.loadData();
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Failed to create task';
                console.error(err);
                this.loading = false;
            }
        });
    }

    editTask(task: MaintenanceTask): void {
        this.editingTask = task;
        this.newTask = {
            vehicleId: task.vehicleId,
            categoryId: task.categoryId,
            taskType: task.taskType,
            description: task.description,
            priority: task.priority,
            status: task.status,
            scheduledDate: typeof task.scheduledDate === 'string'
                ? task.scheduledDate.split('T')[0]
                : new Date(task.scheduledDate).toISOString().split('T')[0],
            estimatedCost: task.estimatedCost,
            assignedTo: task.assignedTo,
            serviceProvider: task.serviceProvider
        };
        this.showAddForm = true;
    }

    updateTask(): void {
        if (!this.editingTask || !this.validateForm()) {
            return;
        }

        this.loading = true;
        this.maintenanceService.updateTask(this.editingTask.id!, this.newTask as any).subscribe({
            next: () => {
                this.loadData();
                this.resetForm();
                this.showAddForm = false;
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Failed to update task';
                console.error(err);
                this.loading = false;
            }
        });
    }

    deleteTask(id: string): void {
        if (!confirm('Are you sure you want to delete this maintenance task?')) {
            return;
        }

        this.loading = true;
        this.maintenanceService.deleteTask(id).subscribe({
            next: () => {
                this.tasks = this.tasks.filter(t => t.id !== id);
                this.applyFilters();
                this.loadData();
                this.loading = false;
            },
            error: (err) => {
                this.error = 'Failed to delete task';
                console.error(err);
                this.loading = false;
            }
        });
    }

    completeTask(task: MaintenanceTask): void {
        const updatedTask = {
            ...task,
            status: 'Completed',
            completedDate: new Date().toISOString()
        };

        this.maintenanceService.updateTask(task.id!, updatedTask as any).subscribe({
            next: () => {
                this.loadData();
            },
            error: (err) => {
                this.error = 'Failed to complete task';
                console.error(err);
            }
        });
    }

    viewRequestDetails(request: MaintenanceRequest): void {
        this.selectedRequest = request;
        this.showRequestDetails = true;
    }

    closeRequestDetails(): void {
        this.showRequestDetails = false;
        this.selectedRequest = null;
    }

    updateRequestStatus(id: string, status: string, mechanic?: string, notes?: string): void {
        this.maintenanceRequestService.updateRequestStatus(id, status, mechanic, notes).subscribe({
            next: (response: any) => {
                console.log('Status updated:', response);

                const message = response.vehicleStatus
                    ? `Status updated to ${status}. Vehicle status: ${response.vehicleStatus}`
                    : `Status updated to ${status}`;
                alert(message);

                this.loadData();
                this.closeRequestDetails();
            },
            error: (err) => {
                this.error = 'Failed to update request status';
                console.error(err);
            }
        });
    }

    validateForm(): boolean {
        if (!this.newTask.vehicleId || !this.newTask.categoryId ||
            !this.newTask.taskType || !this.newTask.description ||
            !this.newTask.scheduledDate) {
            this.error = 'Please fill in all required fields';
            return false;
        }
        this.error = '';
        return true;
    }

    getVehicleDisplay(task: MaintenanceTask): string {
        if (task.vehicle) {
            return `${task.vehicle.make} ${task.vehicle.model} (${task.vehicle.licensePlate})`;
        }
        return 'Unknown Vehicle';
    }

    getRequestVehicleDisplay(request: MaintenanceRequest): string {
        if (request.vehicle) {
            return `${request.vehicle.make} ${request.vehicle.model} (${request.vehicle.licensePlate})`;
        }
        return 'Unknown Vehicle';
    }

    getCategoryName(categoryId: number): string {
        const category = this.categories.find(c => c.id === categoryId);
        return category ? category.name : 'Unknown';
    }

    getStatusClass(status: string): string {
        const statusClasses: { [key: string]: string } = {
            'Scheduled': 'status-scheduled',
            'InProgress': 'status-in-progress',
            'Completed': 'status-completed',
            'Cancelled': 'status-cancelled',
            'Overdue': 'status-overdue',
            'Pending': 'status-pending'
        };
        return statusClasses[status] || '';
    }

    getPriorityClass(priority: string): string {
        const priorityClasses: { [key: string]: string } = {
            'High': 'priority-high',
            'Medium': 'priority-medium',
            'Low': 'priority-low'
        };
        return priorityClasses[priority] || '';
    }

    getSeverityClass(severity: string): string {
        const severityClasses: { [key: string]: string } = {
            'Critical': 'severity-critical',
            'High': 'severity-high',
            'Medium': 'severity-medium',
            'Low': 'severity-low'
        };
        return severityClasses[severity] || '';
    }

    formatDate(date: Date | string | undefined): string {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString();
    }

    formatCurrency(amount: number | undefined): string {
        if (!amount) return '₱0.00';
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    }

    downloadCSV(): void {
        if (this.activeTab === 'tasks') {
            this.downloadTasksCSV();
        } else {
            this.downloadRequestsCSV();
        }
    }

    private downloadTasksCSV(): void {
        const headers = [
            'Task Type', 'Vehicle', 'Category', 'Priority', 'Status',
            'Scheduled Date', 'Completed Date', 'Estimated Cost', 'Actual Cost',
            'Assigned To', 'Service Provider', 'Description'
        ];

        const rows = this.filteredTasks.map(task => [
            task.taskType,
            this.getVehicleDisplay(task),
            this.getCategoryName(task.categoryId),
            task.priority,
            task.status,
            this.formatDate(task.scheduledDate),
            this.formatDate(task.completedDate),
            task.estimatedCost?.toString() || '0',
            task.actualCost?.toString() || '0',
            task.assignedTo || '',
            task.serviceProvider || '',
            task.description.replace(/,/g, ';')
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        this.downloadFile(csvContent, `maintenance_tasks_${new Date().toISOString().split('T')[0]}.csv`);
    }

    private downloadRequestsCSV(): void {
        const headers = [
            'Request ID', 'Vehicle', 'Driver', 'Issue Type', 'Severity',
            'Status', 'Priority', 'Reported Date', 'Description',
            'Assigned Mechanic', 'Estimated Cost', 'Actual Cost'
        ];

        const rows = this.filteredRequests.map(request => [
            request.id || '',
            this.getRequestVehicleDisplay(request),
            request.driver?.name || request.reportedBy || 'N/A',
            request.issueType,
            request.issueSeverity,
            request.status || 'Pending',
            request.priority,
            this.formatDate(request.reportedDate),
            request.description.replace(/,/g, ';'),
            request.assignedMechanic || 'N/A',
            request.estimatedCost?.toString() || '0',
            request.actualCost?.toString() || '0'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        this.downloadFile(csvContent, `maintenance_requests_${new Date().toISOString().split('T')[0]}.csv`);
    }

    private downloadFile(content: string, filename: string): void {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
