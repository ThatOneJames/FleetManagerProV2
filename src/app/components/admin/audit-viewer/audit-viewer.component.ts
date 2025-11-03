import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogService, AuditLog, AuditStatistics } from '../../../services/audit-log.service';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
    selector: 'app-audit-viewer',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './audit-viewer.component.html',
    styleUrls: ['./audit-viewer.component.css']
})
export class AuditViewerComponent implements OnInit, OnDestroy {
    auditLogs: AuditLog[] = [];
    statistics: AuditStatistics | null = null;
    loading = false;

    // Filters
    filterUserId = '';
    filterEntityType = '';
    filterActionType = '';
    filterUserRole = ''; // ✅ NEW: Role filter

    // Pagination
    currentPage = 1;
    pageSize = 10;
    totalLogs = 0;

    // Search
    searchTerm = '';
    private searchSubject = new Subject<string>();
    private destroy$ = new Subject<void>();

    constructor(private auditService: AuditLogService) { }

    ngOnInit() {
        this.loadAuditLogs();
        this.loadStatistics();

        // Search debouncing
        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe((term) => {
            this.filterUserId = term;
            this.currentPage = 1;
            this.loadAuditLogs();
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadAuditLogs() {
        this.loading = true;
        const skip = (this.currentPage - 1) * this.pageSize;

        this.auditService.getAuditLogs(
            this.filterUserId || undefined,
            this.filterEntityType || undefined,
            this.filterActionType || undefined,
            this.filterUserRole || undefined, // ✅ NEW
            this.pageSize,
            skip
        ).pipe(takeUntil(this.destroy$)).subscribe({
            next: (logs) => {
                this.auditLogs = logs;
                this.loading = false;
            },
            error: (err) => {
                console.error('Failed to load audit logs:', err);
                this.loading = false;
            }
        });

        // Load count for pagination
        this.auditService.getAuditLogsCount(
            this.filterUserId || undefined,
            this.filterEntityType || undefined,
            this.filterActionType || undefined,
            this.filterUserRole || undefined // ✅ NEW
        ).pipe(takeUntil(this.destroy$)).subscribe({
            next: (data) => {
                this.totalLogs = data.count;
            },
            error: (err) => console.error('Failed to load count:', err)
        });
    }

    loadStatistics() {
        this.auditService.getAuditStatistics().pipe(takeUntil(this.destroy$)).subscribe({
            next: (stats) => {
                this.statistics = stats;
            },
            error: (err) => console.error('Failed to load statistics:', err)
        });
    }

    onFilterChange() {
        this.currentPage = 1;
        this.loadAuditLogs();
    }

    onSearch(term: string) {
        this.searchSubject.next(term);
    }

    onRefresh() {
        this.loadAuditLogs();
        this.loadStatistics();
    }

    getActionClass(action: string): string {
        return `action-${action.toLowerCase()}`;
    }

    getStatusClass(status: string): string {
        return `status-${status.toLowerCase()}`;
    }

    // ✅ NEW: Get role badge color
    getRoleClass(role: string): string {
        return `role-${role.toLowerCase()}`;
    }

    // ✅ NEW: Get role icon
    getRoleIcon(role: string): string {
        const iconMap: { [key: string]: string } = {
            'Admin': '👨‍💼',
            'Driver': '🚗'
        };
        return iconMap[role] || '👤';
    }

    getEntityTypeIcon(entityType: string): string {
        const iconMap: { [key: string]: string } = {
            'Route': '🛣️',
            'Vehicle': '🚗',
            'Driver': '👤',
            'MaintenanceTask': '🔧',
            'LeaveRequest': '📅',
            'Notification': '📢',
            'Attendance': '✓',
            'User': '👥'
        };
        return iconMap[entityType] || '📋';
    }

    getTotalPages(): number {
        return Math.ceil(this.totalLogs / this.pageSize);
    }

    goToPage(page: number) {
        if (page >= 1 && page <= this.getTotalPages()) {
            this.currentPage = page;
            this.loadAuditLogs();
        }
    }

    exportToCsv() {
        if (this.auditLogs.length === 0) {
            alert('No logs to export');
            return;
        }

        const csv = this.convertToCsv(this.auditLogs);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit-logs-${new Date().toISOString()}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
    }

    private convertToCsv(logs: AuditLog[]): string {
        const headers = ['Timestamp', 'Name', 'Role', 'Action', 'Entity Type', 'Description', 'Status']; // ✅ CHANGED: User → Name, Added Role
        const rows = logs.map(log => [
            new Date(log.timestamp).toLocaleString(),
            log.userName,
            log.userRole, // ✅ NEW
            log.actionType,
            log.entityType,
            log.description || '',
            log.status
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        return csv;
    }
}
