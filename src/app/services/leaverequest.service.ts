import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface LeaveRequest {
    id: string;
    driverId: string;
    leaveTypeEnum: LeaveType;
    leaveTypeName: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
    status: LeaveStatus;
    approvedBy?: string;
    approvedAt?: string;
    rejectionReason?: string;
    createdAt: string;
    updatedAt: string;
    driver?: {
        id: string;
        name: string;
        email: string;
    };
    approverUser?: {
        id: string;
        name: string;
        email: string;
    };
}

export enum LeaveType {
    Annual = 1,
    Sick = 2,
    Personal = 3,
    Emergency = 4,
    Maternity = 5,
    Paternity = 6,
    Bereavement = 7,
    Other = 8
}

export enum LeaveStatus {
    Pending = 0,
    Approved = 1,
    Rejected = 2,
    Cancelled = 3
}

export interface CreateLeaveRequestDto {
    driverId: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    reason: string;
}

export interface LeaveBalance {
    annual: LeaveBalanceItem;
    sick: LeaveBalanceItem;
    personal: LeaveBalanceItem;
}

export interface LeaveBalanceItem {
    used: number;
    total: number;
    remaining: number;
}

export interface ApproveLeaveRequestDto {
    approvedBy: string;
    notes?: string;
}

export interface RejectLeaveRequestDto {
    rejectedBy: string;
    rejectionReason: string;
}

export interface LeaveTypeInfo {
    name: string;
    description: string;
}

@Injectable({
    providedIn: 'root'
})
export class LeaveRequestService {
    private readonly apiUrl = 'http://localhost:5129/api/leaverequests';

    private httpOptions = {
        headers: new HttpHeaders({
            'Content-Type': 'application/json'
        })
    };

    constructor(private http: HttpClient) { }

    getAllLeaveRequests(): Observable<LeaveRequest[]> {
        return this.http.get<LeaveRequest[]>(this.apiUrl).pipe(catchError(this.handleError));
    }

    getLeaveRequestsByDriverId(driverId: string): Observable<LeaveRequest[]> {
        return this.http.get<LeaveRequest[]>(`${this.apiUrl}/driver/${driverId}`).pipe(catchError(this.handleError));
    }

    getLeaveRequestById(id: string): Observable<LeaveRequest> {
        return this.http.get<LeaveRequest>(`${this.apiUrl}/${id}`).pipe(catchError(this.handleError));
    }

    createLeaveRequest(dto: CreateLeaveRequestDto): Observable<LeaveRequest> {
        return this.http.post<LeaveRequest>(this.apiUrl, dto, this.httpOptions).pipe(catchError(this.handleError));
    }

    approveLeaveRequest(id: string, dto: ApproveLeaveRequestDto): Observable<LeaveRequest> {
        return this.http.put<LeaveRequest>(`${this.apiUrl}/${id}/approve`, dto, this.httpOptions).pipe(catchError(this.handleError));
    }

    rejectLeaveRequest(id: string, dto: RejectLeaveRequestDto): Observable<LeaveRequest> {
        return this.http.put<LeaveRequest>(`${this.apiUrl}/${id}/reject`, dto, this.httpOptions).pipe(catchError(this.handleError));
    }

    deleteLeaveRequest(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(catchError(this.handleError));
    }

    getLeaveBalance(driverId: string): Observable<LeaveBalance> {
        return this.http.get<LeaveBalance>(`${this.apiUrl}/balance/${driverId}`).pipe(catchError(this.handleError));
    }

    getLeaveTypes(): Observable<LeaveTypeInfo[]> {
        return this.http.get<LeaveTypeInfo[]>(`${this.apiUrl}/types`).pipe(catchError(this.handleError));
    }

    getLeaveTypeString(leaveType: LeaveType): string {
        return LeaveType[leaveType];
    }

    getLeaveStatusString(status: LeaveStatus): string {
        return LeaveStatus[status];
    }

    getStatusClass(status: LeaveStatus): string {
        switch (status) {
            case LeaveStatus.Approved: return 'status-approved';
            case LeaveStatus.Pending: return 'status-pending';
            case LeaveStatus.Rejected: return 'status-rejected';
            case LeaveStatus.Cancelled: return 'status-cancelled';
            default: return '';
        }
    }

    getTypeClass(leaveType: LeaveType): string {
        switch (leaveType) {
            case LeaveType.Annual: return 'type-annual';
            case LeaveType.Sick: return 'type-sick';
            case LeaveType.Personal: return 'type-personal';
            case LeaveType.Emergency: return 'type-emergency';
            case LeaveType.Maternity:
            case LeaveType.Paternity: return 'type-family';
            case LeaveType.Bereavement: return 'type-bereavement';
            default: return 'type-other';
        }
    }

    calculateBusinessDays(startDate: Date, endDate: Date): number {
        let count = 0;
        const current = new Date(startDate);
        while (current <= endDate) {
            const dayOfWeek = current.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
            current.setDate(current.getDate() + 1);
        }
        return count;
    }

    validateLeaveRequest(dto: CreateLeaveRequestDto): string[] {
        const errors: string[] = [];
        const startDate = new Date(dto.startDate);
        const endDate = new Date(dto.endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (startDate < today) errors.push('Start date cannot be in the past');
        if (endDate < startDate) errors.push('End date cannot be before start date');

        if (dto.leaveType !== LeaveType.Emergency) {
            const advanceNotice = new Date();
            advanceNotice.setDate(today.getDate() + 1);
            if (startDate < advanceNotice) errors.push('Leave requests require at least 1 day advance notice');
        }

        if (!dto.reason || dto.reason.trim().length < 10) errors.push('Please provide a detailed reason (minimum 10 characters)');
        return errors;
    }

    private handleError(error: any): Observable<never> {
        console.error('An error occurred:', error);
        let errorMessage = 'An unexpected error occurred';
        if (error.error?.message) errorMessage = error.error.message;
        else if (error.message) errorMessage = error.message;
        return throwError(() => new Error(errorMessage));
    }
}
