export interface MaintenanceTask {
    id?: string;
    vehicleId: string;
    categoryId: number;
    taskType: string;
    description: string;
    priority: 'High' | 'Medium' | 'Low';
    status: 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled' | 'Overdue';
    scheduledDate: Date | string;
    completedDate?: Date | string;
    scheduledMileage?: number;
    completedMileage?: number;
    estimatedCost?: number;
    actualCost?: number;
    assignedTo?: string;
    technicianNotes?: string;
    partsUsed?: string;
    laborHours?: number;
    serviceProvider?: string;
    warrantyUntil?: Date | string;
    createdBy?: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;

    // Populated from navigation
    vehicle?: {
        id: string;
        make: string;
        model: string;
        licensePlate: string;
    };
    category?: MaintenanceCategory;
}

export interface MaintenanceCategory {
    id?: number;
    name: string;
    description?: string;
    defaultIntervalMiles?: number;
    defaultIntervalMonths?: number;
    createdAt?: Date | string;
}

export interface MaintenanceReminder {
    id?: number;
    vehicleId: string;
    categoryId: number;
    reminderType: 'Mileage' | 'Date' | 'Both';
    nextServiceMiles?: number;
    nextServiceDate?: Date | string;
    intervalMiles?: number;
    intervalMonths?: number;
    lastServiceDate?: Date | string;
    lastServiceMiles?: number;
    isActive: boolean;
    createdAt?: Date | string;
    updatedAt?: Date | string;

    // Populated from navigation
    vehicle?: {
        id: string;
        make: string;
        model: string;
        licensePlate: string;
    };
    category?: MaintenanceCategory;
}

export interface MaintenanceStatistics {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    scheduledTasks: number;
    inProgressTasks: number;
    totalCost: number;
}

export interface CreateMaintenanceTaskDto {
    vehicleId: string;
    categoryId: number;
    taskType: string;
    description: string;
    priority: string;
    status: string;
    scheduledDate: string;
    scheduledMileage?: number;
    estimatedCost?: number;
    assignedTo?: string;
    serviceProvider?: string;
}

export interface UpdateMaintenanceTaskDto {
    vehicleId: string;
    categoryId: number;
    taskType: string;
    description: string;
    priority: string;
    status: string;
    scheduledDate: string;
    completedDate?: string;
    scheduledMileage?: number;
    completedMileage?: number;
    estimatedCost?: number;
    actualCost?: number;
    assignedTo?: string;
    technicianNotes?: string;
    partsUsed?: string;
    laborHours?: number;
    serviceProvider?: string;
    warrantyUntil?: string;
}