import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
    MaintenanceTask,
    MaintenanceCategory,
    MaintenanceReminder,
    MaintenanceStatistics,
    CreateMaintenanceTaskDto,
    UpdateMaintenanceTaskDto
} from '../models/maintenance.model';

@Injectable({
    providedIn: 'root'
})
export class MaintenanceService {
    private apiUrl = 'http://localhost:5129/api/maintenance';

    constructor(private http: HttpClient) { }

    // Tasks
    getAllTasks(vehicleId?: string, status?: string, priority?: string): Observable<MaintenanceTask[]> {
        let params = new HttpParams();
        if (vehicleId) params = params.set('vehicleId', vehicleId);
        if (status) params = params.set('status', status);
        if (priority) params = params.set('priority', priority);

        return this.http.get<MaintenanceTask[]>(`${this.apiUrl}/tasks`, { params });
    }

    getTaskById(id: string): Observable<MaintenanceTask> {
        return this.http.get<MaintenanceTask>(`${this.apiUrl}/tasks/${id}`);
    }

    createTask(task: CreateMaintenanceTaskDto): Observable<MaintenanceTask> {
        return this.http.post<MaintenanceTask>(`${this.apiUrl}/tasks`, task);
    }

    updateTask(id: string, task: UpdateMaintenanceTaskDto): Observable<any> {
        return this.http.put(`${this.apiUrl}/tasks/${id}`, { ...task, id });
    }

    deleteTask(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/tasks/${id}`);
    }

    getOverdueTasks(): Observable<MaintenanceTask[]> {
        return this.http.get<MaintenanceTask[]>(`${this.apiUrl}/overdue`);
    }

    getUpcomingTasks(days: number = 30): Observable<MaintenanceTask[]> {
        const params = new HttpParams().set('days', days.toString());
        return this.http.get<MaintenanceTask[]>(`${this.apiUrl}/upcoming`, { params });
    }

    // Categories
    getAllCategories(): Observable<MaintenanceCategory[]> {
        return this.http.get<MaintenanceCategory[]>(`${this.apiUrl}/categories`);
    }

    createCategory(category: MaintenanceCategory): Observable<MaintenanceCategory> {
        return this.http.post<MaintenanceCategory>(`${this.apiUrl}/categories`, category);
    }

    // Reminders
    getAllReminders(vehicleId?: string): Observable<MaintenanceReminder[]> {
        let params = new HttpParams();
        if (vehicleId) params = params.set('vehicleId', vehicleId);
        return this.http.get<MaintenanceReminder[]>(`${this.apiUrl}/reminders`, { params });
    }

    createReminder(reminder: MaintenanceReminder): Observable<MaintenanceReminder> {
        return this.http.post<MaintenanceReminder>(`${this.apiUrl}/reminders`, reminder);
    }

    // Statistics
    getStatistics(): Observable<MaintenanceStatistics> {
        return this.http.get<MaintenanceStatistics>(`${this.apiUrl}/statistics`);
    }
}