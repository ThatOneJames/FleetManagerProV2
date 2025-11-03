import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuditLog {
    id: string;
    userId: string;
    userName: string;
    userRole: string; // ✅ NEW: User role field
    actionType: string;
    entityType: string;
    entityId: string;
    description: string;
    oldValue?: string;
    newValue?: string;
    status: string;
    timestamp: Date;
}

export interface AuditStatistics {
    totalActions: number;
    totalCreates: number;
    totalUpdates: number;
    totalDeletes: number;
    totalLogins: number;
    successRate: number;
    adminActions: number; // ✅ NEW: Admin action count
    driverActions: number; // ✅ NEW: Driver action count
    topUsers: Array<{ userId: string; count: number }>;
}

@Injectable({
    providedIn: 'root'
})
export class AuditLogService {
    private readonly apiUrl = `${environment.apiUrl}/audit-logs`;

    constructor(private http: HttpClient) { }

    // Get all audit logs with filters
    getAuditLogs(
        userId?: string,
        entityType?: string,
        actionType?: string,
        userRole?: string, // ✅ NEW: Add role filter
        limit: number = 100,
        skip: number = 0
    ): Observable<AuditLog[]> {
        let params = `?limit=${limit}&skip=${skip}`;
        if (userId) params += `&userId=${userId}`;
        if (entityType) params += `&entityType=${entityType}`;
        if (actionType) params += `&actionType=${actionType}`;
        if (userRole) params += `&userRole=${userRole}`; // ✅ NEW

        return this.http.get<AuditLog[]>(`${this.apiUrl}${params}`);
    }

    // Get count of audit logs
    getAuditLogsCount(
        userId?: string,
        entityType?: string,
        actionType?: string,
        userRole?: string // ✅ NEW
    ): Observable<{ count: number }> {
        let params = '';
        if (userId) params += `?userId=${userId}`;
        if (entityType) params += `${params ? '&' : '?'}entityType=${entityType}`;
        if (actionType) params += `${params ? '&' : '?'}actionType=${actionType}`;
        if (userRole) params += `${params ? '&' : '?'}userRole=${userRole}`; // ✅ NEW

        return this.http.get<{ count: number }>(`${this.apiUrl}/count${params}`);
    }

    // Get audit logs for specific user
    getUserAuditLogs(userId: string, limit: number = 100): Observable<AuditLog[]> {
        return this.http.get<AuditLog[]>(`${this.apiUrl}/user/${userId}?limit=${limit}`);
    }

    // Get audit logs for specific entity
    getEntityAuditLogs(entityType: string, entityId: string): Observable<AuditLog[]> {
        return this.http.get<AuditLog[]>(`${this.apiUrl}/entity/${entityType}/${entityId}`);
    }

    // Get audit statistics
    getAuditStatistics(startDate?: Date, endDate?: Date): Observable<AuditStatistics> {
        let params = '';
        if (startDate) params += `?startDate=${startDate.toISOString()}`;
        if (endDate) params += `${params ? '&' : '?'}endDate=${endDate.toISOString()}`;

        return this.http.get<AuditStatistics>(`${this.apiUrl}/statistics${params}`);
    }

    // Create audit log
    createAuditLog(auditLog: Partial<AuditLog>): Observable<AuditLog> {
        return this.http.post<AuditLog>(this.apiUrl, auditLog);
    }

    // Log activity (helper method)
    logActivity(
        actionType: string,
        entityType: string,
        entityId: string,
        description: string,
        oldValue?: any,
        newValue?: any
    ): void {
        const log: Partial<AuditLog> = {
            actionType,
            entityType,
            entityId,
            description,
            oldValue: JSON.stringify(oldValue),
            newValue: JSON.stringify(newValue),
            status: 'SUCCESS'
        };

        // Fire and forget
        this.createAuditLog(log).subscribe(
            () => console.log('Activity logged'),
            (err) => console.error('Failed to log activity:', err)
        );
    }
}
