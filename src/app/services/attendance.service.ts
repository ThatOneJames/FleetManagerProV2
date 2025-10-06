// src/app/services/attendance.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface AttendanceRecord {
    id: number;
    driverId: string;
    driverName: string;
    date: string;
    clockIn?: string;
    clockOut?: string;
    totalHours?: number;
    breakDuration: number;
    overtimeHours: number;
    status: 'Present' | 'Absent' | 'Late' | 'HalfDay' | 'OnLeave';
    location?: string;
    notes?: string;
    approvedBy?: string;
    approverName?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ClockInOutRequest {
    driverId?: string;
    location?: string;
    notes?: string;
}

export interface CreateAttendanceRequest {
    driverId: string;
    date: string;
    clockIn?: string;
    clockOut?: string;
    status: string;
    location?: string;
    notes?: string;
    breakDuration?: number;
}

export interface AttendanceStats {
    totalHours: number;
    daysPresent: number;
    daysAbsent: number;
    daysLate: number;
    averageClockIn: string;
    overtimeHours: number;
    attendancePercentage: number;
}

export interface WeeklyAttendance {
    weekStart: string;
    weekEnd: string;
    records: AttendanceRecord[];
    stats: AttendanceStats;
}

@Injectable({
    providedIn: 'root'
})
export class AttendanceService {
    private readonly apiUrl = `${environment.apiUrl}/attendance`;

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    private getHttpOptions() {
        const token = this.authService.getToken();
        return {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            })
        };
    }

    // Get current user's today attendance
    getMyTodayAttendance(): Observable<{ message?: string; data?: AttendanceRecord }> {
        return this.http.get<{ message?: string; data?: AttendanceRecord }>(
            `${this.apiUrl}/my/today`,
            this.getHttpOptions()
        ).pipe(
            catchError(this.handleError)
        );
    }

    // Get current user's weekly attendance
    getMyWeeklyAttendance(weekStart: string): Observable<WeeklyAttendance> {
        const params = new HttpParams().set('weekStart', weekStart);
        return this.http.get<WeeklyAttendance>(
            `${this.apiUrl}/my/week`,
            { ...this.getHttpOptions(), params }
        ).pipe(
            catchError(this.handleError)
        );
    }

    // Clock in
    clockIn(request: ClockInOutRequest): Observable<{ message: string; data?: AttendanceRecord }> {
        return this.http.post<{ message: string; data?: AttendanceRecord }>(
            `${this.apiUrl}/clock-in`,
            request,
            this.getHttpOptions()
        ).pipe(
            catchError(this.handleError)
        );
    }

    // Clock out
    clockOut(request: ClockInOutRequest): Observable<{ message: string; data?: AttendanceRecord }> {
        return this.http.post<{ message: string; data?: AttendanceRecord }>(
            `${this.apiUrl}/clock-out`,
            request,
            this.getHttpOptions()
        ).pipe(
            catchError(this.handleError)
        );
    }

    // Get driver's attendance by date range
    getDriverAttendanceByRange(driverId: string, startDate: string, endDate: string): Observable<AttendanceRecord[]> {
        const params = new HttpParams()
            .set('startDate', startDate)
            .set('endDate', endDate);

        return this.http.get<AttendanceRecord[]>(
            `${this.apiUrl}/driver/${driverId}/range`,
            { ...this.getHttpOptions(), params }
        ).pipe(
            catchError(this.handleError)
        );
    }

    // Get today's attendance for a specific driver
    getTodayAttendance(driverId: string): Observable<AttendanceRecord> {
        return this.http.get<AttendanceRecord>(
            `${this.apiUrl}/driver/${driverId}/today`,
            this.getHttpOptions()
        ).pipe(
            catchError(this.handleError)
        );
    }

    // Get weekly attendance for a specific driver
    getWeeklyAttendance(driverId: string, weekStart: string): Observable<WeeklyAttendance> {
        const params = new HttpParams().set('weekStart', weekStart);
        return this.http.get<WeeklyAttendance>(
            `${this.apiUrl}/driver/${driverId}/week`,
            { ...this.getHttpOptions(), params }
        ).pipe(
            catchError(this.handleError)
        );
    }

    // Get attendance statistics
    getAttendanceStats(driverId: string, startDate: string, endDate: string): Observable<AttendanceStats> {
        const params = new HttpParams()
            .set('startDate', startDate)
            .set('endDate', endDate);

        return this.http.get<AttendanceStats>(
            `${this.apiUrl}/driver/${driverId}/stats`,
            { ...this.getHttpOptions(), params }
        ).pipe(
            catchError(this.handleError)
        );
    }

    // Create attendance record
    createAttendance(request: CreateAttendanceRequest): Observable<AttendanceRecord> {
        return this.http.post<AttendanceRecord>(
            this.apiUrl,
            request,
            this.getHttpOptions()
        ).pipe(
            catchError(this.handleError)
        );
    }

    // Update attendance record
    updateAttendance(id: number, request: Partial<AttendanceRecord>): Observable<{ message: string }> {
        return this.http.put<{ message: string }>(
            `${this.apiUrl}/${id}`,
            request,
            this.getHttpOptions()
        ).pipe(
            catchError(this.handleError)
        );
    }

    // Delete attendance record
    deleteAttendance(id: number): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(
            `${this.apiUrl}/${id}`,
            this.getHttpOptions()
        ).pipe(
            catchError(this.handleError)
        );
    }

    // Helper methods for frontend
    getCurrentWeekStart(): string {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Make Monday = 0
        const monday = new Date(today);
        monday.setDate(today.getDate() - mondayOffset);
        return monday.toISOString().split('T')[0];
    }

    getCurrentWeekEnd(): string {
        const weekStart = new Date(this.getCurrentWeekStart());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return weekEnd.toISOString().split('T')[0];
    }

    formatTimeForDisplay(timeString?: string): string {
        if (!timeString) return 'N/A';

        // Handle both "HH:mm" and "HH:mm:ss" formats
        const timeParts = timeString.split(':');
        if (timeParts.length >= 2) {
            const hours = parseInt(timeParts[0]);
            const minutes = timeParts[1];
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            return `${displayHours}:${minutes} ${ampm}`;
        }
        return timeString;
    }

    formatTime24Hour(timeString?: string): string {
        if (!timeString) return 'N/A';
        const timeParts = timeString.split(':');
        if (timeParts.length >= 2) {
            return `${timeParts[0]}:${timeParts[1]}`;
        }
        return timeString;
    }

    calculateHoursWorked(clockIn?: string, clockOut?: string, breakDuration: number = 0): number {
        if (!clockIn || !clockOut) return 0;

        const start = new Date(`1970-01-01T${clockIn}:00`);
        const end = new Date(`1970-01-01T${clockOut}:00`);

        const diffMs = end.getTime() - start.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        return Math.max(0, diffHours - breakDuration);
    }

    getStatusClass(status: string): string {
        switch (status.toLowerCase()) {
            case 'present':
                return 'bg-green-100 text-green-700';
            case 'absent':
                return 'bg-red-100 text-red-700';
            case 'late':
                return 'bg-yellow-100 text-yellow-700';
            case 'halfday':
                return 'bg-blue-100 text-blue-700';
            case 'onleave':
                return 'bg-purple-100 text-purple-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    }

    getStatusDisplayName(status: string): string {
        switch (status.toLowerCase()) {
            case 'present':
                return 'Present';
            case 'absent':
                return 'Absent';
            case 'late':
                return 'Late';
            case 'halfday':
                return 'Half Day';
            case 'onleave':
                return 'On Leave';
            default:
                return status;
        }
    }

    isWorkingHours(): boolean {
        const now = new Date();
        const hour = now.getHours();
        // Consider working hours as 6 AM to 10 PM
        return hour >= 6 && hour < 22;
    }

    private handleError(error: any): Observable<never> {
        console.error('Attendance service error:', error);

        let errorMessage = 'An error occurred';

        if (error.error?.message) {
            errorMessage = error.error.message;
        } else if (error.message) {
            errorMessage = error.message;
        } else if (error.status === 401) {
            errorMessage = 'Unauthorized - Please login again';
        } else if (error.status === 403) {
            errorMessage = 'Access denied';
        } else if (error.status === 404) {
            errorMessage = 'Resource not found';
        } else if (error.status >= 500) {
            errorMessage = 'Server error - Please try again later';
        }

        return throwError(() => new Error(errorMessage));
    }
}