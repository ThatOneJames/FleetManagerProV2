import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
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

    // Reactive Form
    maintenanceForm!: FormGroup;

    statusOptions = ['Scheduled', 'InProgress', 'Completed', 'Cancelled', 'Overdue'];
    priorityOptions = ['High', 'Medium', 'Low'];

    requestStatusOptions = ['Pending', 'InProgress', 'Completed', 'Cancelled'];
    severityOptions = ['Critical', 'High', 'Medium', 'Low'];

    loading: boolean = false;
    errorMessage: string | null = null;
    successMessage: string | null = null;

    constructor(
        private maintenanceService: MaintenanceService,
        private maintenanceRequestService: MaintenanceRequestService,
        private vehicleService: VehicleService,
        private fb: FormBuilder
    ) { }

    ngOnInit(): void {
        this.initializeForm();
        this.loadData();
    }

    // ========== FORM INITIALIZATION WITH VALIDATION ==========
    initializeForm(): void {
        this.maintenanceForm = this.fb.group({
            vehicleId: ['', [Validators.required]],
            categoryId: [0, [Validators.required, Validators.min(1)]],
            taskType: ['', [
                Validators.required,
                Validators.minLength(3),
                Validators.maxLength(100)
            ]],
            description: ['', [
                Validators.required,
                Validators.minLength(10),
                Validators.maxLength(1000)
            ]],
            priority: ['Medium', [Validators.required]],
            status: ['Scheduled', [Validators.required]],
            scheduledDate: ['', [
                Validators.required,
                this.futureDateValidator()
            ]],
            estimatedCost: [0, [
                Validators.min(0),
                Validators.max(10000000)
            ]],
            assignedTo: ['', [Validators.maxLength(100)]],
            serviceProvider: ['', [Validators.maxLength(200)]]
        });
    }

    // ========== CUSTOM VALIDATORS ==========
    private futureDateValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value) {
                return null;
            }

            const inputDate = new Date(control.value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (inputDate < today) {
                return { pastDate: true };
            }

            return null;
        };
    }

    // ========== ERROR MESSAGE HANDLER ==========
    getFieldErrorMessage(form: FormGroup, fieldName: string): string {
        const control = form.get(fieldName);

        if (!control || !control.errors || !control.touched) {
            return '';
        }

        const errors = control.errors;

        if (errors['required']) {
            return `${this.getFieldLabel(fieldName)} is required`;
        }

        if (errors['minlength']) {
            return `${this.getFieldLabel(fieldName)} must be at least ${errors['minlength'].requiredLength} characters`;
        }

        if (errors['maxlength']) {
            return `${this.getFieldLabel(fieldName)} cannot exceed ${errors['maxlength'].requiredLength} characters`;
        }

        if (errors['min']) {
            return `${this.getFieldLabel(fieldName)} must be at least ${errors['min'].min}`;
        }

        if (errors['max']) {
            return `${this.getFieldLabel(fieldName)} cannot exceed ${errors['max'].max}`;
        }

        if (errors['pastDate']) {
            return 'Scheduled date must be today or in the future';
        }

        return 'Invalid input';
    }

    private getFieldLabel(fieldName: string): string {
        const labels: { [key: string]: string } = {
            vehicleId: 'Vehicle',
            categoryId: 'Category',
            taskType: 'Task Type',
            description: 'Description',
            priority: 'Priority',
            status: 'Status',
            scheduledDate: 'Scheduled Date',
            estimatedCost: 'Estimated Cost',
            assignedTo: 'Assigned To',
            serviceProvider: 'Service Provider'
        };

        return labels[fieldName] || fieldName;
    }

    isFieldInvalid(form: FormGroup, fieldName: string): boolean {
        const field = form.get(fieldName);
        return !!(field && field.invalid && field.touched);
    }

    // ========== DATA LOADING ==========
    loadData(): void {
        this.loading = true;
        this.errorMessage = null;

        this.maintenanceService.getAllTasks().subscribe({
            next: (data) => {
                this.tasks = data;
                this.applyFilters();
                this.calculateStatistics();
                this.loading = false;
            },
            error: (err) => {
                this.errorMessage = 'Failed to load maintenance tasks';
                console.error(err);
                this.loading = false;
                this.clearMessages();
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
    }

    // ========== CRUD OPERATIONS WITH VALIDATION ==========
    toggleAddForm(): void {
        this.showAddForm = !this.showAddForm;
        if (!this.showAddForm) {
            this.resetForm();
        }
    }

    resetForm(): void {
        this.maintenanceForm.reset({
            vehicleId: '',
            categoryId: 0,
            taskType: '',
            description: '',
            priority: 'Medium',
            status: 'Scheduled',
            scheduledDate: '',
            estimatedCost: 0,
            assignedTo: '',
            serviceProvider: ''
        });
        this.editingTask = null;
        this.errorMessage = null;
    }

    addTask(): void {
        this.markFormGroupTouched(this.maintenanceForm);

        if (this.maintenanceForm.invalid) {
            const errors: string[] = [];
            Object.keys(this.maintenanceForm.controls).forEach(key => {
                const control = this.maintenanceForm.get(key);
                if (control && control.invalid) {
                    const message = this.getFieldErrorMessage(this.maintenanceForm, key);
                    if (message) {
                        errors.push(message);
                    }
                }
            });

            this.errorMessage = errors.length > 0 ? errors.join('. ') : 'Please fill out all required fields correctly';
            this.clearMessages();
            return;
        }

        this.loading = true;
        const taskData = this.maintenanceForm.value as CreateMaintenanceTaskDto;

        this.maintenanceService.createTask(taskData).subscribe({
            next: (task) => {
                this.tasks.unshift(task);
                this.applyFilters();
                this.resetForm();
                this.showAddForm = false;
                this.successMessage = 'Maintenance task created successfully!';
                this.loadData();
                this.loading = false;
                this.clearMessages();
            },
            error: (err) => {
                this.errorMessage = 'Failed to create task';
                console.error(err);
                this.loading = false;
                this.clearMessages();
            }
        });
    }

    editTask(task: MaintenanceTask): void {
        this.editingTask = task;
        this.maintenanceForm.patchValue({
            vehicleId: task.vehicleId,
            categoryId: task.categoryId,
            taskType: task.taskType,
            description: task.description,
            priority: task.priority,
            status: task.status,
            scheduledDate: typeof task.scheduledDate === 'string'
                ? task.scheduledDate.split('T')[0]
                : new Date(task.scheduledDate).toISOString().split('T')[0],
            estimatedCost: task.estimatedCost || 0,
            assignedTo: task.assignedTo || '',
            serviceProvider: task.serviceProvider || ''
        });
        this.showAddForm = true;
    }

    updateTask(): void {
        this.markFormGroupTouched(this.maintenanceForm);

        if (!this.editingTask || this.maintenanceForm.invalid) {
            const errors: string[] = [];
            Object.keys(this.maintenanceForm.controls).forEach(key => {
                const control = this.maintenanceForm.get(key);
                if (control && control.invalid) {
                    const message = this.getFieldErrorMessage(this.maintenanceForm, key);
                    if (message) {
                        errors.push(message);
                    }
                }
            });

            this.errorMessage = errors.length > 0 ? errors.join('. ') : 'Please fill out all required fields correctly';
            this.clearMessages();
            return;
        }

        this.loading = true;
        const taskData = this.maintenanceForm.value;

        this.maintenanceService.updateTask(this.editingTask.id!, taskData as any).subscribe({
            next: () => {
                this.successMessage = 'Maintenance task updated successfully!';
                this.loadData();
                this.resetForm();
                this.showAddForm = false;
                this.loading = false;
                this.clearMessages();
            },
            error: (err) => {
                this.errorMessage = 'Failed to update task';
                console.error(err);
                this.loading = false;
                this.clearMessages();
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
                this.successMessage = 'Maintenance task deleted successfully!';
                this.loadData();
                this.loading = false;
                this.clearMessages();
            },
            error: (err) => {
                this.errorMessage = 'Failed to delete task';
                console.error(err);
                this.loading = false;
                this.clearMessages();
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
                this.successMessage = 'Task marked as completed!';
                this.loadData();
                this.clearMessages();
            },
            error: (err) => {
                this.errorMessage = 'Failed to complete task';
                console.error(err);
                this.clearMessages();
            }
        });
    }

    // ========== MAINTENANCE REQUESTS ==========
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
                const message = response.vehicleStatus
                    ? `Status updated to ${status}. Vehicle status: ${response.vehicleStatus}`
                    : `Status updated to ${status}`;
                this.successMessage = message;
                this.loadData();
                this.closeRequestDetails();
                this.clearMessages();
            },
            error: (err) => {
                this.errorMessage = 'Failed to update request status';
                console.error(err);
                this.clearMessages();
            }
        });
    }

    // ========== FILTERS & TAB SWITCHING ==========
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

    // ========== DISPLAY HELPERS ==========
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

    // ========== CSV EXPORT ==========
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

    // ========== PRIVATE HELPER METHODS ==========
    private markFormGroupTouched(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach(field => {
            const control = formGroup.get(field);
            control?.markAsTouched({ onlySelf: true });
        });
    }

    private clearMessages(): void {
        setTimeout(() => {
            this.successMessage = null;
            this.errorMessage = null;
        }, 5000);
    }
}
